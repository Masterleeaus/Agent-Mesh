import type { RetryConfig, ExecutionError, RuntimeConfig } from '../types';

export function isRetryableError(error: Error, config: RetryConfig): boolean {
  if (config.retryableErrors.includes('*')) return true;
  for (const code of config.retryableErrors) {
    if (error.message.includes(code) || error.message.includes(code.toLowerCase())) {
      return true;
    }
  }
  return false;
}

export function calculateBackoff(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelayMs * Math.pow(config.backoffFactor, attempt - 1);
  return Math.min(delay, config.maxDelayMs);
}

export function createRetryError(attempt: number, error: Error): ExecutionError {
  return {
    attempt,
    timestamp: new Date().toISOString(),
    code: error.name || 'UNKNOWN',
    message: error.message,
    recoverable: true,
  };
}

export function shouldRetry(
  attempt: number,
  config: RetryConfig,
  error: Error,
): boolean {
  if (attempt >= config.maxAttempts) return false;
  return isRetryableError(error, config);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function calculateTimeout(
  attempt: number,
  config: RuntimeConfig,
): number {
  const base = config.timeout.defaultMs;
  const backoffMs = attempt > 1 ? calculateBackoff(attempt, config.retry) : 0;
  return Math.min(base + backoffMs, config.timeout.hardLimitMs);
}
