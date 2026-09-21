import type { ApiError } from './ApiClient';

export type ErrorCategory = 'auth' | 'validation' | 'server' | 'network' | 'timeout' | 'unknown';

export interface ErrorHandlerConfig {
  onAuthError?: () => void;
  onServerError?: (error: ApiError) => void;
  onNetworkError?: (error: ApiError) => void;
  logError?: (error: ApiError, category: ErrorCategory) => void;
}

export class ErrorHandler {
  private config: ErrorHandlerConfig;

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = config;
  }

  categorize(error: ApiError): ErrorCategory {
    if (error.status === 0) return 'network';
    if (error.status === 408) return 'timeout';
    if (error.status === 401 || error.status === 403) return 'auth';
    if (error.status === 400 || error.status === 422) return 'validation';
    if (error.status >= 500) return 'server';
    return 'unknown';
  }

  handle(error: ApiError): ErrorCategory {
    const category = this.categorize(error);
    this.config.logError?.(error, category);
    if (category === 'auth') this.config.onAuthError?.();
    if (category === 'server') this.config.onServerError?.(error);
    if (category === 'network') this.config.onNetworkError?.(error);
    return category;
  }

  getUserMessage(error: ApiError, category?: ErrorCategory): string {
    const c = category || this.categorize(error);
    switch (c) {
      case 'auth': return 'Your session has expired. Please log in again.';
      case 'validation': return error.message || 'Please check your input and try again.';
      case 'server': return 'A server error occurred. Our team has been notified.';
      case 'network': return 'Unable to connect. Please check your internet connection.';
      case 'timeout': return 'The request timed out. Please try again.';
      default: return 'An unexpected error occurred. Please try again.';
    }
  }
}
