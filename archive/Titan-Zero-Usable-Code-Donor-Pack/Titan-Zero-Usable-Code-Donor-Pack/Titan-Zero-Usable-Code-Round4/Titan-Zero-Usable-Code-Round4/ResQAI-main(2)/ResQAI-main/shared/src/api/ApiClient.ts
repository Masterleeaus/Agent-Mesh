export interface ApiClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = { timeout: 30000, ...config };
  }

  setConfig(config: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.config.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }

  private async request<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', headers, body, params, signal } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.buildUrl(path, params), {
        method,
        headers: { ...this.config.headers, ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: signal || controller.signal,
      });

      const responseData = response.status === 204 ? null : await response.json();

      if (!response.ok) {
        const error: ApiError = {
          message: responseData?.message || response.statusText,
          status: response.status,
          code: responseData?.code,
          details: responseData?.details,
        };
        throw error;
      }

      return { data: responseData as T, status: response.status, headers: response.headers };
    } catch (err) {
      if ((err as ApiError).status) throw err;
      if ((err as Error).name === 'AbortError') {
        throw { message: 'Request timed out', status: 408, code: 'TIMEOUT' } as ApiError;
      }
      throw { message: (err as Error).message || 'Network error', status: 0, code: 'NETWORK_ERROR' } as ApiError;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  async put<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  async patch<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  async delete<T>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}
