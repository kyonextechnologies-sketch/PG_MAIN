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
    this.config = {
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
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

        if (session?.user) {
          config.headers = {
            ...config.headers,
            'X-User-ID': session.user.id || '',
            'X-User-Role': session.user.role || 'USER',
          };
        }
      } catch {
        console.warn('⚠️ [ApiClient] No session found');
      }
      return config;
    });
  }

  // ----------------------- Core Request Methods -----------------------

  async get<T>(endpoint: string, config?: ApiRequestConfig) {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T>(endpoint: string, data?: any, config?: ApiRequestConfig) {
    return this.request<T>('POST', endpoint, data, config);
  }

  async put<T>(endpoint: string, data?: any, config?: ApiRequestConfig) {
    return this.request<T>('PUT', endpoint, data, config);
  }

  async patch<T>(endpoint: string, data?: any, config?: ApiRequestConfig) {
    return this.request<T>('PATCH', endpoint, data, config);
  }

  async delete<T>(endpoint: string, config?: ApiRequestConfig) {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  // ----------------------- Core Logic -----------------------

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    const retries = config?.retries ?? this.config.retries;
    const retryDelay = config?.retryDelay ?? this.config.retryDelay;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const reqConfig = await this.buildRequestConfig(method, data, config);
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
          
          throw new Error(errorMessage);
        }

        const json = await this.safeJson(res);
        return {
          success: true,
          data: json?.data ?? json,
          message: json?.message ?? 'Success',
          timestamp: new Date().toISOString(),
        };
      } catch (err: any) {
        lastError = err;
        console.error(`❌ [ApiClient] Attempt ${attempt + 1}/${retries + 1} failed:`, err.message);

        if (attempt < retries && this.shouldRetry(err)) {
          await this.delay(retryDelay * (attempt + 1));
          continue;
        }
        break;
      }
    }

    console.error('🚨 [ApiClient] Final failure:', lastError?.message);
    return this.handleError(lastError);
  }

  // ----------------------- Helpers -----------------------

  private async buildRequestConfig(
    method: string,
    data?: any,
    config?: ApiRequestConfig
  ): Promise<RequestInit> {
    let requestConfig: RequestInit = {
      method,
      headers: {
        ...this.config.defaultHeaders,
        ...config?.headers,
      },
      credentials: 'include',
    };

    if (data) requestConfig.body = JSON.stringify(data);
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

  private shouldRetry(error: Error): boolean {
    return (
      error.name === 'AbortError' ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('HTTP 5')
    );
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ----------------------- Error Handling -----------------------

  private handleError(error: any): ApiResponse<any> {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Unexpected error occurred while processing request';

    console.error('🔴 [ApiClient] Error Details:', { message });

    ErrorHandler.handle({
      code: 'HTTP_ERROR',
      message,
      statusCode: error?.response?.status || 400,
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
    console.warn('🔐 [ApiClient] Unauthorized — redirecting to /login');
    window.location.href = '/login';
  }
  return res;
});
