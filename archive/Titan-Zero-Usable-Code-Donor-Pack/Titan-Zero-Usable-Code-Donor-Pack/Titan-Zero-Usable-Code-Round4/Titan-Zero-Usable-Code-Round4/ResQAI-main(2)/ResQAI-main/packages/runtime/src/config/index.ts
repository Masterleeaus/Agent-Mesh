import type { RuntimeConfig, ModelProvider, LogLevel } from '../types';
import {
  DEFAULT_RUNTIME_CONFIG, DEFAULT_COST_CONFIG, LOG_LEVELS,
} from './schema';

export function loadRuntimeConfig(overrides?: Partial<RuntimeConfig>): RuntimeConfig {
  const envProvider = (process.env.AI_PROVIDER || 'lemma') as ModelProvider;
  const envLevel = (process.env.RUNTIME_LOG_LEVEL || 'info') as LogLevel;
  const envBudget = parseInt(process.env.AI_BUDGET_CENTS || '', 10);

  return {
    ...DEFAULT_RUNTIME_CONFIG,
    agentName: overrides?.agentName || DEFAULT_RUNTIME_CONFIG.agentName,
    provider: overrides?.provider || envProvider,
    model: overrides?.model || process.env.AI_MODEL || undefined,
    execution: {
      ...DEFAULT_RUNTIME_CONFIG.execution,
      ...overrides?.execution,
    },
    context: {
      ...DEFAULT_RUNTIME_CONFIG.context,
      ...overrides?.context,
    },
    memory: {
      ...DEFAULT_RUNTIME_CONFIG.memory,
      ...overrides?.memory,
    },
    retry: {
      ...DEFAULT_RUNTIME_CONFIG.retry,
      ...overrides?.retry,
    },
    timeout: {
      ...DEFAULT_RUNTIME_CONFIG.timeout,
      ...overrides?.timeout,
    },
    cost: {
      ...DEFAULT_RUNTIME_CONFIG.cost,
      ...(overrides?.cost || {
        ...DEFAULT_COST_CONFIG,
        budgetCents: isNaN(envBudget) ? DEFAULT_COST_CONFIG.budgetCents : envBudget,
      }),
    },
    routing: {
      ...DEFAULT_RUNTIME_CONFIG.routing,
      ...overrides?.routing,
    },
    fallback: {
      ...DEFAULT_RUNTIME_CONFIG.fallback,
      ...overrides?.fallback,
    },
    observability: {
      ...DEFAULT_RUNTIME_CONFIG.observability,
      ...overrides?.observability,
    },
    logging: {
      ...DEFAULT_RUNTIME_CONFIG.logging,
      ...overrides?.logging,
      level: overrides?.logging?.level || envLevel,
    },
  };
}

export function isLogLevelEnabled(current: LogLevel, target: LogLevel): boolean {
  return LOG_LEVELS[current] <= LOG_LEVELS[target];
}
