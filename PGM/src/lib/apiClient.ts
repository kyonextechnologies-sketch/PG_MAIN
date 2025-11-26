/**
 * API Client (Fixed + Stable)
 * ---------------------------------------
 * Robust API handler with retries, auth headers,
 * unified error responses, and NextAuth integration.
 */

import { getSession } from 'next-auth/react';
import { ErrorHandler } from './errors';
import { getSessionId } from './session';
import { getTabSession } from './tabSession';
import { getTabId, getSessionCookieName } from './auth/tabSession';
import { getSessionCookie } from './auth/cookies';
import { readSession } from './auth/readSession';

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
  params?: Record<
    string,
    | string
    | number
    | boolean
    | null
    | undefined
    | Array<string | number | boolean>
  >;
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
        // Add per-tab session ID header
        const sessionId = getSessionId();
        if (sessionId) {
          config.headers = {
            ...config.headers,
            'X-Session-ID': sessionId,
          };
        }

        // Get tab ID for per-tab cookie isolation
        const tabId = getTabId();
        if (tabId) {
          config.headers = {
            ...config.headers,
            'X-Tab-ID': tabId,
          };
        }

        // Priority 1: Check for per-tab session cookie (new system)
        if (tabId && typeof document !== 'undefined') {
          const sessionCookie = getSessionCookie();
          const session = readSession();
          
          if (sessionCookie && session) {
            // Use per-tab session cookie
            config.headers = {
              ...config.headers,
              'Authorization': `Bearer ${sessionCookie}`,
              'X-User-ID': session.userId,
              'X-User-Role': session.role,
              'X-Tab-ID': tabId,
            };
            
            // Include cookie in request for server-side API routes
            const cookieName = getSessionCookieName();
            config.headers = {
              ...config.headers,
              'Cookie': `${cookieName}=${sessionCookie}`,
            };
            
            if (process.env.NODE_ENV === 'development') {
              console.log('🔐 [ApiClient] Per-tab session cookie used:', {
                tabId,
                cookieName,
                userId: session.userId,
              });
            }
            return config;
          }
        }

        // Priority 2: Check for old tab session system
        const tabSession = getTabSession();
        if (tabSession && tabSession.accessToken) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${tabSession.accessToken}`,
            'X-User-ID': tabSession.userId,
            'X-User-Role': tabSession.role,
            'X-Tab-ID': tabSession.tabId,
          };
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 [ApiClient] Tab session headers added:', {
              tabId: tabSession.tabId,
              userId: tabSession.userId,
            });
          }
          return config;
        }

        // Priority 3: Fall back to NextAuth session
        const session = await getSession();
        if (session?.user?.id) {
          const accessToken = (session as any).accessToken;
          config.headers = {
            ...config.headers,
            'X-User-ID': session.user.id,
            'X-User-Role': session.user.role || 'USER',
            ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
          };
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 [ApiClient] NextAuth session headers added:', {
              userId: session.user.id,
            });
          }
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
    let url = `${this.config.baseURL}${normalizedEndpoint}`;

    if (config?.params) {
      const query = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
          value.forEach((v) => query.append(key, String(v)));
        } else {
          query.append(key, String(value));
        }
      });

      const queryString = query.toString();
      if (queryString) {
        url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
      }
    }
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
        
        // Handle different response formats
        let responseData = json;
        if (json && typeof json === 'object') {
          // If response has a 'data' field, use it; otherwise use the whole json
          responseData = json.data !== undefined ? json.data : json;
        }
        
        return {
          success: true,
          data: responseData,
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
        
        // Don't log 404s as errors - they're expected for optional endpoints
        const isNotFoundError = lastError.message.includes('404') || 
                               lastError.message.includes('Route not found') ||
                               lastError.message.includes('Not Found');
        
        // Don't log validation errors (400) as retry attempts - they're client-side errors
        const isValidationError = lastError.message.includes('400') ||
                                 lastError.message.includes('Validation failed') ||
                                 lastError.message.includes('Bad Request');
        
        const isConnectionError = lastError.message.includes('Failed to fetch') ||
                                 lastError.message.includes('ERR_CONNECTION_REFUSED') ||
                                 lastError.message.includes('NetworkError') ||
                                 lastError.message.includes('ECONNREFUSED');
        
        if (isAuthError) {
          // Only log auth errors once
          if (attempt === 0) {
            console.warn(`⚠️ [ApiClient] Authentication error (not retrying):`, lastError.message);
          }
        } else if (isNotFoundError) {
          // Silently handle 404s - don't log as errors
          // The calling code should handle this gracefully
        } else if (isValidationError) {
          // Validation errors shouldn't be retried - log once without retry count
          if (attempt === 0) {
            console.warn(`⚠️ [ApiClient] Validation error (not retrying):`, lastError.message);
          }
        } else if (isConnectionError) {
          // Only log connection errors on first attempt and final failure
          // Don't spam console with retry attempts
          if (attempt === 0 && process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ [ApiClient] Connection error (attempting retry):`, lastError.message);
          }
        } else {
          // Only log non-connection errors on first attempt
          if (attempt === 0) {
            console.warn(`⚠️ [ApiClient] Request failed (attempting retry):`, lastError.message);
          }
        }

        // Don't retry authentication errors
        if (attempt < retries && this.shouldRetry(err)) {
          await this.delay(retryDelay * (attempt + 1));
          continue;
        }
        break;
      }
    }

    // Don't log 404s or connection errors as final failures
    const isNotFoundError = lastError?.message?.includes('404') || 
                           lastError?.message?.includes('Route not found') ||
                           lastError?.message?.includes('Not Found');
    
    const isConnectionError = lastError?.message?.includes('Failed to fetch') ||
                             lastError?.message?.includes('ERR_CONNECTION_REFUSED') ||
                             lastError?.message?.includes('NetworkError') ||
                             lastError?.message?.includes('ECONNREFUSED');
    
    if (!isNotFoundError && !isConnectionError) {
      // Only log non-connection errors as final failures
      console.error('🚨 [ApiClient] Request failed after retries:', lastError?.message);
    } else if (isConnectionError) {
      // Only log connection errors in development, and only once per request
      if (process.env.NODE_ENV === 'development') {
        // Use a flag to prevent multiple logs for the same error
        const errorKey = `connection_error_${Date.now()}`;
        if (!(window as any).__lastConnectionError || (window as any).__lastConnectionError < Date.now() - 5000) {
          console.warn('⚠️ [ApiClient] Backend server not reachable. Ensure backend is running on port 5000.');
          (window as any).__lastConnectionError = Date.now();
        }
      }
    }
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
    
    // Don't retry validation errors (400) - client-side errors that won't be fixed by retrying
    if (error.message.includes('400') ||
        error.message.includes('Validation failed') ||
        error.message.includes('Bad Request')) {
      return false;
    }
    
    // Don't retry 404s - route not found won't be fixed by retrying
    if (error.message.includes('404') || 
        error.message.includes('Route not found') ||
        error.message.includes('Not Found')) {
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

        // Don't log 404s or connection errors as errors
        const isNotFoundError = message.includes('404') || 
                               message.includes('Route not found') ||
                               message.includes('Not Found') ||
                               statusCode === 404;

        const isConnectionError = message.includes('Failed to fetch') ||
                                 message.includes('ERR_CONNECTION_REFUSED') ||
                                 message.includes('NetworkError') ||
                                 message.includes('ECONNREFUSED');

        if (!isNotFoundError && !isConnectionError) {
          // Only log non-connection errors
          console.error('🔴 [ApiClient] Error Details:', { message });
          ErrorHandler.handle({
            code: 'HTTP_ERROR',
            message,
            statusCode,
          });
        }
        // Connection errors are silently handled - they're expected if backend is not running
        // Don't spam console with connection errors

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
