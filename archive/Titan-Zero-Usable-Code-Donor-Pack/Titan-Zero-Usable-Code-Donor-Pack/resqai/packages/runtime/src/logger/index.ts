import type { LogConfig, LogLevel, RuntimeConfig, ExecutionResult } from '../types';
import { isLogLevelEnabled } from '../config';

class RuntimeLogger {
  private config: LogConfig;

  constructor(config?: LogConfig) {
    this.config = config || { level: 'info', structured: true, output: 'console', includeTimestamps: true };
  }

  configure(config: LogConfig): void {
    this.config = config;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (!isLogLevelEnabled(this.config.level, level)) return;

    const entry = this.format(level, message, meta);
    const output = JSON.stringify(entry);

    if (this.config.output === 'console' || this.config.output === 'both') {
      if (level === 'error') {
        process.stderr.write(output + '\n');
      } else {
        process.stdout.write(output + '\n');
      }
    }

    if ((this.config.output === 'file' || this.config.output === 'both') && this.config.filePath) {
      const fs = require('fs');
      fs.appendFileSync(this.config.filePath, output + '\n');
    }
  }

  private format(level: LogLevel, message: string, meta?: Record<string, unknown>): Record<string, unknown> {
    const entry: Record<string, unknown> = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };
    if (this.config.includeTimestamps) {
      entry.ts = Date.now();
    }
    if (meta && Object.keys(meta).length > 0) {
      entry.meta = meta;
    }
    return entry;
  }

  debug(message: string, meta?: Record<string, unknown>): void { this.log('debug', message, meta); }
  info(message: string, meta?: Record<string, unknown>): void { this.log('info', message, meta); }
  warn(message: string, meta?: Record<string, unknown>): void { this.log('warn', message, meta); }
  error(message: string, meta?: Record<string, unknown>): void { this.log('error', message, meta); }

  logExecutionStart(agentName: string, runId: string, traceId: string): void {
    this.info('agent_execution_start', { agent: agentName, runId, traceId });
  }

  logExecutionComplete(result: ExecutionResult): void {
    const level = result.status === 'success' ? 'info' : result.status === 'fallback' ? 'warn' : 'error';
    this.log(level, `agent_execution_${result.status}`, {
      agent: result.agentName,
      runId: result.runId,
      status: result.status,
      durationMs: result.timing.durationMs,
      costCents: result.cost.totalCents,
      confidence: result.confidence,
      routingAction: result.routingAction,
      traceId: result.traceId,
    });
  }

  logRetry(agentName: string, attempt: number, maxAttempts: number, error: string): void {
    this.warn('agent_retry', { agent: agentName, attempt, maxAttempts, error });
  }

  logFallback(agentName: string, action: string, reason: string): void {
    this.warn('agent_fallback', { agent: agentName, action, reason });
  }

  logCostAlert(agentName: string, costCents: number, budgetCents: number): void {
    this.warn('cost_alert', { agent: agentName, costCents, budgetCents, ratio: (costCents / budgetCents).toFixed(2) });
  }
}

let loggerInstance: RuntimeLogger;

export function getLogger(config?: LogConfig): RuntimeLogger {
  if (!loggerInstance) {
    loggerInstance = new RuntimeLogger(config);
  }
  if (config) {
    loggerInstance.configure(config);
  }
  return loggerInstance;
}

export { RuntimeLogger };
