export type ModelProvider = 'lemma' | 'openai' | 'anthropic' | 'azure-openai' | 'google';

export type ExecutionMode = 'auto' | 'semi-auto' | 'manual';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type ConfidenceLevel = 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;

export type RoutingAction = 'execute' | 'fallback_human' | 'escalate' | 'retry' | 'degrade';

export type AgentStatus = 'pending' | 'running' | 'success' | 'failure' | 'timeout' | 'fallback' | 'cancelled';

export interface RuntimeConfig {
  agentName: string;
  provider: ModelProvider;
  model?: string;
  execution: ExecutionConfig;
  context: ContextConfig;
  memory: MemoryConfig;
  retry: RetryConfig;
  timeout: TimeoutConfig;
  cost: CostConfig;
  routing: RoutingConfig;
  fallback: FallbackConfig;
  observability: ObservabilityConfig;
  logging: LogConfig;
}

export interface ExecutionConfig {
  mode: ExecutionMode;
  maxConcurrency?: number;
  queueEnabled?: boolean;
}

export interface ContextConfig {
  maxTokens: number;
  windowStrategy: 'sliding' | 'summary' | 'truncate' | 'hybrid';
  compressionEnabled: boolean;
  systemPromptPolicy: 'always' | 'first_only' | 'truncated';
}

export interface MemoryConfig {
  enabled: boolean;
  type: 'none' | 'conversation' | 'long-term' | 'hybrid';
  maxMessages: number;
  summarizationThreshold: number;
  ttlMs?: number;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableErrors: string[];
}

export interface TimeoutConfig {
  defaultMs: number;
  hardLimitMs: number;
  warmingMs?: number;
}

export interface CostConfig {
  enabled: boolean;
  budgetCents: number;
  alertThreshold: number;
  currency: string;
  modelRates: Record<string, CostRate>;
}

export interface CostRate {
  inputPer1K: number;
  outputPer1K: number;
  currency: string;
}

export interface RoutingConfig {
  enabled: boolean;
  confidenceThresholds: ConfidenceThresholds;
  modelRouting: boolean;
  degradeOnCost: boolean;
}

export interface ConfidenceThresholds {
  autoExecute: number;
  requireReview: number;
  escalate: number;
  fallback: number;
}

export interface FallbackConfig {
  enabled: boolean;
  fallbackProvider?: ModelProvider;
  fallbackModel?: string;
  humanReviewQueue: string;
  escalationTargets: EscalationTarget[];
  autoEscalateAfterMs: number;
}

export interface EscalationTarget {
  role: string;
  channel: string;
  notify: boolean;
}

export interface ObservabilityConfig {
  enabled: boolean;
  tracingEnabled: boolean;
  metricsEnabled: boolean;
  exportEndpoint?: string;
  sampleRate: number;
}

export interface LogConfig {
  level: LogLevel;
  structured: boolean;
  output: 'console' | 'file' | 'both';
  filePath?: string;
  includeTimestamps: boolean;
}

export interface ExecutionResult {
  agentName: string;
  runId: string;
  status: AgentStatus;
  output: unknown;
  confidence: number;
  routingAction: RoutingAction;
  timing: ExecutionTiming;
  cost: CostReport;
  errors: ExecutionError[];
  metadata: Record<string, unknown>;
  traceId: string;
}

export interface ExecutionTiming {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  llmCallMs: number;
  contextLoadMs: number;
  retryWaitMs: number;
}

export interface CostReport {
  totalCents: number;
  inputTokens: number;
  outputTokens: number;
  inputCostCents: number;
  outputCostCents: number;
  estimatedTotal: number;
  budgetExceeded: boolean;
}

export interface ExecutionError {
  attempt: number;
  timestamp: string;
  code: string;
  message: string;
  recoverable: boolean;
}

export interface RuntimeContext {
  agentName: string;
  config: RuntimeConfig;
  input: unknown;
  schema: unknown;
  sessionId: string;
  traceId: string;
  spanId: string;
  messages: RuntimeMessage[];
  memory: RuntimeMemory;
  startTime: number;
}

export interface RuntimeMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  timestamp: string;
  tokenCount?: number;
}

export interface RuntimeMemory {
  shortTerm: RuntimeMessage[];
  longTerm: MemoryEntry[];
  summary?: string;
}

export interface MemoryEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokenCount?: number;
  summary?: string;
}

export interface Span {
  spanId: string;
  parentSpanId?: string;
  traceId: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: 'ok' | 'error';
  attributes: Record<string, unknown>;
  events: SpanEvent[];
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, unknown>;
}

export interface ConfidenceResult {
  score: number;
  action: RoutingAction;
  reasoning: string;
  thresholds: ConfidenceThresholds;
}

export interface FallbackRequest {
  agentName: string;
  runId: string;
  input: unknown;
  error: ExecutionError;
  confidence: number;
  routingAction: RoutingAction;
}

export interface FallbackResult {
  handled: boolean;
  action: 'retry' | 'fallback_model' | 'human_queue' | 'escalate' | 'degrade';
  assignedTo?: string;
  queueName?: string;
  reason: string;
}
