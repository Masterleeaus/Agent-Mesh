import type {
  RuntimeConfig, ExecutionConfig, ContextConfig, MemoryConfig,
  RetryConfig, TimeoutConfig, CostConfig, RoutingConfig,
  FallbackConfig, ObservabilityConfig, LogConfig,
  ModelProvider, LogLevel,
} from '../types';

export const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  mode: 'auto',
  maxConcurrency: 1,
  queueEnabled: false,
};

export const DEFAULT_CONTEXT_CONFIG: ContextConfig = {
  maxTokens: 128_000,
  windowStrategy: 'sliding',
  compressionEnabled: true,
  systemPromptPolicy: 'always',
};

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  enabled: true,
  type: 'hybrid',
  maxMessages: 50,
  summarizationThreshold: 30,
  ttlMs: 86_400_000,
};

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  backoffFactor: 2,
  retryableErrors: ['RATE_LIMITED', 'TIMEOUT', 'SERVER_ERROR', 'UNAVAILABLE'],
};

export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  defaultMs: 120_000,
  hardLimitMs: 300_000,
  warmingMs: 5_000,
};

export const DEFAULT_COST_CONFIG: CostConfig = {
  enabled: true,
  budgetCents: 10_000,
  alertThreshold: 0.8,
  currency: 'USD',
  modelRates: {
    'lemma': { inputPer1K: 0.003, outputPer1K: 0.015, currency: 'USD' },
    'gpt-4o': { inputPer1K: 0.01, outputPer1K: 0.03, currency: 'USD' },
    'gpt-4o-mini': { inputPer1K: 0.0015, outputPer1K: 0.006, currency: 'USD' },
    'claude-3.5-sonnet': { inputPer1K: 0.003, outputPer1K: 0.015, currency: 'USD' },
    'claude-3-haiku': { inputPer1K: 0.00025, outputPer1K: 0.00125, currency: 'USD' },
  },
};

export const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  enabled: true,
  confidenceThresholds: {
    autoExecute: 0.8,
    requireReview: 0.6,
    escalate: 0.4,
    fallback: 0.2,
  },
  modelRouting: false,
  degradeOnCost: true,
};

export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enabled: true,
  fallbackProvider: 'lemma',
  humanReviewQueue: 'human-review',
  escalationTargets: [
    { role: 'ops_manager', channel: 'discord', notify: true },
    { role: 'team_lead', channel: 'email', notify: true },
  ],
  autoEscalateAfterMs: 300_000,
};

export const DEFAULT_OBSERVABILITY_CONFIG: ObservabilityConfig = {
  enabled: true,
  tracingEnabled: true,
  metricsEnabled: true,
  sampleRate: 1.0,
};

export const DEFAULT_LOG_CONFIG: LogConfig = {
  level: 'info',
  structured: true,
  output: 'console',
  includeTimestamps: true,
};

export const SUPPORTED_PROVIDERS: ModelProvider[] = ['lemma', 'openai', 'anthropic', 'azure-openai', 'google'];

export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  agentName: 'unknown',
  provider: 'lemma',
  model: undefined,
  execution: DEFAULT_EXECUTION_CONFIG,
  context: DEFAULT_CONTEXT_CONFIG,
  memory: DEFAULT_MEMORY_CONFIG,
  retry: DEFAULT_RETRY_CONFIG,
  timeout: DEFAULT_TIMEOUT_CONFIG,
  cost: DEFAULT_COST_CONFIG,
  routing: DEFAULT_ROUTING_CONFIG,
  fallback: DEFAULT_FALLBACK_CONFIG,
  observability: DEFAULT_OBSERVABILITY_CONFIG,
  logging: DEFAULT_LOG_CONFIG,
};
