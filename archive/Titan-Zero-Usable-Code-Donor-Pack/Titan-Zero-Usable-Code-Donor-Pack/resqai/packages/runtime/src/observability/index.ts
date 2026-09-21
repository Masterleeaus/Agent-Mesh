import type { Span, SpanEvent, RuntimeConfig, ExecutionResult } from '../types';

const activeSpans = new Map<string, Span>();
const completedTraces = new Map<string, Span[]>();

export function startSpan(
  name: string,
  traceId: string,
  parentSpanId?: string,
  attributes?: Record<string, unknown>,
): Span {
  const span: Span = {
    spanId: crypto.randomUUID(),
    parentSpanId,
    traceId,
    name,
    startTime: performance.now(),
    status: 'ok',
    attributes: attributes || {},
    events: [],
  };
  activeSpans.set(span.spanId, span);
  return span;
}

export function endSpan(spanId: string, status: 'ok' | 'error' = 'ok'): void {
  const span = activeSpans.get(spanId);
  if (!span) return;
  span.endTime = performance.now();
  span.status = status;
  activeSpans.delete(spanId);

  const trace = completedTraces.get(span.traceId) || [];
  trace.push(span);
  completedTraces.set(span.traceId, trace);
}

export function addSpanEvent(spanId: string, name: string, attributes?: Record<string, unknown>): void {
  const span = activeSpans.get(spanId);
  if (!span) return;
  span.events.push({ name, timestamp: performance.now(), attributes: attributes || {} });
}

export function setSpanAttribute(spanId: string, key: string, value: unknown): void {
  const span = activeSpans.get(spanId);
  if (!span) return;
  span.attributes[key] = value;
}

export function getTrace(traceId: string): Span[] | undefined {
  return completedTraces.get(traceId);
}

export function recordExecutionMetrics(result: ExecutionResult): void {
  if (!result.metadata) return;
  const traceId = result.traceId;
  const trace = getTrace(traceId);
  if (!trace) return;

  const totalSpanTime = trace.reduce((sum, s) => sum + ((s.endTime || s.startTime) - s.startTime), 0);
  const spanCount = trace.length;
  const errorSpans = trace.filter(s => s.status === 'error').length;

  const metricsPayload = {
    agent: result.agentName,
    runId: result.runId,
    status: result.status,
    durationMs: result.timing.durationMs,
    totalSpanTime,
    spanCount,
    errorSpans,
    confidence: result.confidence,
    costCents: result.cost.totalCents,
    inputTokens: result.cost.inputTokens,
    outputTokens: result.cost.outputTokens,
    routingAction: result.routingAction,
    timestamp: new Date().toISOString(),
  };

  if (config && config.observability.exportEndpoint) {
    exportMetrics(metricsPayload).catch(() => {});
  }
}

let config: RuntimeConfig | null = null;

export function configureObservability(cfg: RuntimeConfig): void {
  config = cfg;
}

async function exportMetrics(payload: Record<string, unknown>): Promise<void> {
  if (!config?.observability.exportEndpoint) return;
  try {
    await fetch(config.observability.exportEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // silently fail metrics export
  }
}

export function clearTraces(traceId?: string): void {
  if (traceId) {
    completedTraces.delete(traceId);
  } else {
    completedTraces.clear();
  }
}
