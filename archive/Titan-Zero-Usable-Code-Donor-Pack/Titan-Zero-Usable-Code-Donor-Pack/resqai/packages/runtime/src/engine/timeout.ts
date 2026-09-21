import type { TimeoutConfig, RuntimeConfig } from '../types';

export class ExecutionTimeoutError extends Error {
  constructor(timeoutMs: number, operation: string) {
    super(`Execution timed out after ${timeoutMs}ms on "${operation}"`);
    this.name = 'EXECUTION_TIMEOUT';
  }
}

export function createTimeoutPromise<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new ExecutionTimeoutError(timeoutMs, operation));
      }, timeoutMs);
    }),
  ]);
}

export function getEffectiveTimeout(config: RuntimeConfig): number {
  return Math.min(config.timeout.defaultMs, config.timeout.hardLimitMs);
}

export function getWarmingTimeout(config: RuntimeConfig): number {
  return config.timeout.warmingMs || 5_000;
}
