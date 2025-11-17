/**
 * API Client (Fixed + Stable)
 * ---------------------------------------
 * Robust API handler with retries, auth headers,
 * unified error responses, and NextAuth integration.
 */

import { getSession } from 'next-auth/react';
import { ErrorHandler } from './errors';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ApiRequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  defaultHeaders: Record<string, string>;
}

class ApiClient {
  private config: ApiClientConfig;
  private requestInterceptors: Array<(config: RequestInit) => Promise<RequestInit>> = [];
  private responseInterceptors: Array<(response: Response) => Response> = [];

  constructor(config: Partial<ApiClientConfig> = {}) {
    // Get baseURL from environment or use default
    let baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    
    // Ensure baseURL has proper protocol
    // On Vercel/production, ensure HTTPS is used if URL doesn't have protocol
    if (typeof window !== 'undefined') {
      // Client-side: ensure we have a valid URL
      if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
        // If no protocol specified, use HTTPS in production, HTTP in development
        const isProduction = window.location.protocol === 'https:';
        baseURL = `${isProduction ? 'https://' : 'http://'}${baseURL}`;
      }
    } else {
      // Server-side: use environment variable as-is or default
      if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
        baseURL = `https://${baseURL}`;
      }
    }
    
    // Remove trailing slash if present
    baseURL = baseURL.replace(/\/$/, '');
    
    this.config = {
      baseURL,
      timeout: 30000,
      retries: 2,
      retryDelay: 800,
      defaultHeaders: { 'Content-Type': 'application/json' },
      ...config,
    };

    // Default interceptor for session headers
    this.addRequestInterceptor(async (config) => {
      try {
        const session = await getSession();

        if (session?.user?.id) {
          config.headers = {
            ...config.headers,
            'X-User-ID': session.user.id,
            'X-User-Role': session.user.role || 'USER',
          };
          // Log in development for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 [ApiClient] Session headers added:', {
              userId: session.user.id,
              role: session.user.role,
            });
          }
        } else {
          console.warn('⚠️ [ApiClient] No valid session found - user ID missing');
          // Don't make the request if there's no valid session
          // This prevents unnecessary API calls
        }
      } catch (error) {
        console.warn('⚠️ [ApiClient] Error getting session:', error);
      }
      return config;
    });
  }

  // ----------------------- Core Request Methods -----------------------

  async get<T>(endpoint: string, config?: ApiRequestConfig) {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T>(endpoint: string, data?: Record<string, unknown> | FormData, config?: ApiRequestConfig) {
    return this.request<T>('POST', endpoint, data, config);
  }

  async put<T>(endpoint: string, data?: Record<string, unknown> | FormData, config?: ApiRequestConfig) {
    return this.request<T>('PUT', endpoint, data, config);
  }

  async patch<T>(endpoint: string, data?: Record<string, unknown> | FormData, config?: ApiRequestConfig) {
    return this.request<T>('PATCH', endpoint, data, config);
  }

  async delete<T>(endpoint: string, config?: ApiRequestConfig) {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  // ----------------------- Core Logic -----------------------

  private async request<T>(
    method: string,
    endpoint: string,
    data?: Record<string, unknown> | FormData,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.config.baseURL}${normalizedEndpoint}`;
    const retries = config?.retries ?? this.config.retries;
    const retryDelay = config?.retryDelay ?? this.config.retryDelay;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const reqConfig = await this.buildRequestConfig(method, data, config);
        
        // Validate URL before making request
        try {
          new URL(url);
        } catch (urlError) {
          throw new Error(`Invalid API URL: ${url}. Please check NEXT_PUBLIC_API_URL environment variable.`);
        }
        
        // Log request details in development only (without sensitive data)
        if (process.env.NODE_ENV === 'development') {
          console.log('📤 [ApiClient] Request:', {
            method,
            url: url.length > 100 ? `${url.substring(0, 100)}...` : url,
            hasBody: !!data,
          });
        }
        
        const res = await this.makeRequest(url, reqConfig, config?.timeout ?? this.config.timeout);

        if (!res.ok) {
          const text = await res.text();
          let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
          
          // Try to parse error response body
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData?.message || errorData?.error || errorMessage;
          } catch {
            // If JSON parsing fails, use text or status text
            if (text) errorMessage = text;
          }
          
          // Handle specific authentication errors
          if (res.status === 401) {
            // User not found or inactive - clear session and redirect
            if (errorMessage.includes('User not found') || errorMessage.includes('inactive')) {
              console.warn('🔐 [ApiClient] User not found or inactive - clearing session');
              if (typeof window !== 'undefined') {
                // Clear any stored session data
                localStorage.removeItem('theme'); // Keep theme, but you can clear other data
                // Redirect to login
                setTimeout(() => {
                  window.location.href = '/login?error=session_expired';
                }, 100);
              }
            }
          }
          
          throw new Error(errorMessage);
        }

        const json = await this.safeJson(res);
        return {
          success: true,
          data: json?.data ?? json,
          message: json?.message ?? 'Success',
          timestamp: new Date().toISOString(),
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          lastError = err;
        } else {
          lastError = new Error(String(err));
        }
        // Don't log authentication errors as errors if they're expected
        const isAuthError = lastError.message.includes('401') || 
                           lastError.message.includes('403') ||
                           lastError.message.includes('Unauthorized') ||
                           lastError.message.includes('User not found') ||
                           lastError.message.includes('inactive');
        
        if (isAuthError) {
          console.warn(`⚠️ [ApiClient] Authentication error (not retrying):`, lastError.message);
        } else {
          console.error(`❌ [ApiClient] Attempt ${attempt + 1}/${retries + 1} failed:`, lastError.message);
        }

        // Don't retry authentication errors
        if (attempt < retries && this.shouldRetry(err)) {
          await this.delay(retryDelay * (attempt + 1));
          continue;
        }
        break;
      }
    }

    console.error('🚨 [ApiClient] Final failure:', lastError?.message);
    return this.handleError(lastError) as ApiResponse<T>;
  }

  // ----------------------- Helpers -----------------------

  private async buildRequestConfig(
    method: string,
    data?: Record<string, unknown> | FormData,
    config?: ApiRequestConfig
  ): Promise<RequestInit> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    let requestConfig: RequestInit = {
      method,
      headers: {
        ...this.config.defaultHeaders,
        ...config?.headers,
      },
      credentials: 'include',
    };

    if (isFormData && requestConfig.headers) {
      const headers = requestConfig.headers as Record<string, string>;
      Object.keys(headers).forEach((key) => {
        if (key.toLowerCase() === 'content-type') {
          delete headers[key];
        }
      });
    }

    if (data !== undefined) {
      requestConfig.body = isFormData ? data : JSON.stringify(data);
    }
    if (config?.signal) requestConfig.signal = config.signal;

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor(requestConfig);
    }

    return requestConfig;
  }

  private async makeRequest(url: string, config: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { ...config, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  private async safeJson(response: Response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    
    // Don't retry authentication errors (401, 403)
    if (error.message.includes('401') || 
        error.message.includes('403') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('User not found') ||
        error.message.includes('inactive')) {
      return false;
    }
    
    // Retry on network errors and server errors (5xx)
    return (
      error.name === 'AbortError' ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('HTTP 5') ||
      error.message.includes('NetworkError')
    );
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ----------------------- Error Handling -----------------------

  private handleError(error: unknown): ApiResponse<unknown> {
    const message =
      (error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unexpected error occurred while processing request')) ||
      'Unexpected error occurred while processing request';

    const statusCode = (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response) ? (error.response.status as number) : 400;

    console.error('🔴 [ApiClient] Error Details:', { message });

    ErrorHandler.handle({
      code: 'HTTP_ERROR',
      message,
      statusCode,
    });

    return {
      success: false,
      message,
      error: message,
      timestamp: new Date().toISOString(),
    };
  }

  // ----------------------- Interceptor Handlers -----------------------

  addRequestInterceptor(interceptor: (config: RequestInit) => Promise<RequestInit>) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: Response) => Response) {
    this.responseInterceptors.push(interceptor);
  }
}

// ----------------------- Singleton Export -----------------------
export const apiClient = new ApiClient();

// Default response interceptor for auth errors
apiClient.addResponseInterceptor((res) => {
  if (res.status === 401 && typeof window !== 'undefined') {
    console.warn('🔐 [ApiClient] Unauthorized (401) — redirecting to /login');
    // Use setTimeout to avoid blocking the response
    setTimeout(() => {
      window.location.href = '/login?error=unauthorized';
    }, 100);
  }
  return res;
});
