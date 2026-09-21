import type { ApiError } from './ApiClient';

export interface RetryManagerConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: ApiError) => void;
}

export class RetryManager {
  private config: Required<RetryManagerConfig>;

  constructor(config: RetryManagerConfig = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      retryableStatuses: [408, 429, 500, 502, 503, 504],
      onRetry: () => {},
      ...config,
    };
  }

  shouldRetry(error: ApiError, attempt: number): boolean {
    if (attempt >= this.config.maxRetries) return false;
    return this.config.retryableStatuses.includes(error.status);
  }

  getDelay(attempt: number): number {
    const delay = Math.min(this.config.baseDelay * Math.pow(2, attempt), this.config.maxDelay);
    return delay + Math.random() * 200;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: ApiError;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as ApiError;
        if (!this.shouldRetry(lastError, attempt)) break;
        this.config.onRetry(attempt + 1, lastError);
        await new Promise(resolve => setTimeout(resolve, this.getDelay(attempt)));
      }
    }
    throw lastError!;
  }
}
