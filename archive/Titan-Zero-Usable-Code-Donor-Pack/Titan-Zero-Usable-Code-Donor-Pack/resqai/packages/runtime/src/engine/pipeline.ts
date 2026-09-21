import type {
  RuntimeConfig, RuntimeContext, RuntimeMessage,
  ExecutionResult, ExecutionTiming, CostReport, ExecutionError,
  AgentStatus, ConfidenceResult, ModelProvider,
} from '../types';
import { loadRuntimeConfig } from '../config';
import { createRuntimeContext, buildMessages, compressContext } from '../context';
import { loadMemory, saveMemory, appendShortTermMemory, appendToLongTermMemory, clearMemoryContext } from '../memory';
import { getDefaultProvider, getProvider } from '../providers';
import { getLogger } from '../logger';
import { startSpan, endSpan, addSpanEvent, configureObservability, recordExecutionMetrics, setSpanAttribute } from '../observability';
import { calculateCost, checkBudget, trackCost } from '../cost';
import { evaluateConfidence, routeByConfidence, shouldDegradeModel } from '../routing';
import { handleFallback, queueForHumanReview } from '../fallback';
import { shouldRetry, calculateBackoff, createRetryError, sleep, calculateTimeout } from './retry';
import { createTimeoutPromise, getEffectiveTimeout } from './timeout';

export interface AgentPayload {
  agentName: string;
  instruction: string;
  input: unknown;
  schema?: unknown;
  config?: Partial<RuntimeConfig>;
}

export async function executeAgent(payload: AgentPayload): Promise<ExecutionResult> {
  const config = loadRuntimeConfig({
    ...payload.config,
    agentName: payload.agentName,
  });

  configureObservability(config);
  const logger = getLogger(config.logging);

  const context = createRuntimeContext(
    payload.agentName,
    config,
    payload.input,
    payload.schema,
  );

  const runId = context.sessionId;
  const traceId = context.traceId;

  logger.logExecutionStart(payload.agentName, runId, traceId);

  const executionSpan = startSpan('agent.execute', traceId, undefined, {
    agent: payload.agentName,
    runId,
  });

  const startTime = Date.now();
  const errors: ExecutionError[] = [];
  let status: AgentStatus = 'pending';
  let output: unknown = null;
  let confidence = 0;
  let result: ExecutionResult = buildResult(context, config, status, output, 0, errors, startTime, runId, traceId);

  try {
    loadMemory(context);

    const contextLoadSpan = startSpan('context.load', traceId, executionSpan.spanId);
    const messages = buildMessages(payload.instruction, payload.input, context);
    const compressedMessages = await compressContext(messages, config);
    context.messages = compressedMessages;
    setSpanAttribute(contextLoadSpan.spanId, 'messageCount', compressedMessages.length);
    setSpanAttribute(contextLoadSpan.spanId, 'totalTokens', compressedMessages.reduce((s, m) => s + m.content.length, 0));
    endSpan(contextLoadSpan.spanId);

    const costCheck = checkBudget(config, { totalCents: 0, inputTokens: 0, outputTokens: 0, inputCostCents: 0, outputCostCents: 0, estimatedTotal: 0, budgetExceeded: false });
    if (!costCheck.allowed) {
      status = 'failure';
      output = { error: 'Budget exceeded', code: 'BUDGET_EXCEEDED' };
      logger.logCostAlert(payload.agentName, 0, config.cost.budgetCents);
      return buildResult(context, config, status, output, 0, errors, startTime, runId, traceId);
    }

    const executionSpanExec = startSpan('llm.execute', traceId, executionSpan.spanId);

    let provider = getDefaultProvider(config);
    if (shouldDegradeModel(config, false)) {
      const degradeModel = 'gpt-4o-mini';
      config.model = degradeModel;
      addSpanEvent(executionSpanExec.spanId, 'model_degraded', { model: degradeModel, reason: 'cost' });
    }

    setSpanAttribute(executionSpanExec.spanId, 'provider', provider.name);
    setSpanAttribute(executionSpanExec.spanId, 'model', config.model || provider.name);

    const maxAttempts = config.retry.maxAttempts;
    let llmResponse = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const timeoutMs = calculateTimeout(attempt, config);
        addSpanEvent(executionSpanExec.spanId, 'attempt', { attempt, maxAttempts, timeoutMs });

        llmResponse = await createTimeoutPromise(
          provider.execute(compressedMessages, config),
          timeoutMs,
          payload.agentName,
        );

        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const execError = createRetryError(attempt, lastError);
        errors.push(execError);

        if (shouldRetry(attempt, config.retry, lastError)) {
          const backoffMs = calculateBackoff(attempt, config.retry);
          logger.logRetry(payload.agentName, attempt, maxAttempts, lastError.message);
          addSpanEvent(executionSpanExec.spanId, 'retry', { attempt, backoffMs, error: lastError.message });
          await sleep(backoffMs);
        } else {
          break;
        }
      }
    }

    endSpan(executionSpanExec.spanId, lastError ? 'error' : 'ok');

    if (lastError || !llmResponse) {
      status = 'failure';
      const errorMsg = lastError?.message || 'Unknown error';
      const errorCode = lastError?.name || 'EXECUTION_ERROR';

      if (errors.length >= config.retry.maxAttempts) {
        status = 'timeout';
      }

      output = { error: errorMsg, code: errorCode };
      confidence = 0;
      addSpanEvent(executionSpan.spanId, 'execution_failed', {
        status,
        error: errorMsg,
        attemptCount: errors.length,
      });
    } else {
      status = 'success';
      const content = llmResponse.content;

      try {
        output = JSON.parse(content);
      } catch {
        output = content;
      }

      const systemMsg = compressedMessages.find(m => m.role === 'system');
      const fullOutput = systemMsg
        ? `${systemMsg.content}\n\n${content}`
        : content;

      if (typeof output === 'object' && output !== null && 'confidence' in (output as Record<string, unknown>)) {
        confidence = (output as Record<string, unknown>).confidence as number;
      } else {
        confidence = 0.85;
      }

      const msg: RuntimeMessage = {
        role: 'assistant',
        content: fullOutput,
        timestamp: new Date().toISOString(),
      };
      appendShortTermMemory(context, msg);
      appendToLongTermMemory(context, msg);

      addSpanEvent(executionSpan.spanId, 'execution_success', {
        outputLength: content.length,
        confidence,
        tokenUsage: llmResponse.usage,
      });
    }

    saveMemory(context);

    const costReport = llmResponse
      ? calculateCost(llmResponse.usage.inputTokens, llmResponse.usage.outputTokens, config)
      : calculateCost(0, 0, config);

    trackCost(config, costReport);

    if (costCheck.alert) {
      logger.logCostAlert(payload.agentName, costReport.totalCents, config.cost.budgetCents);
    }

    const timing: ExecutionTiming = {
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      llmCallMs: llmResponse?.latencyMs || 0,
      contextLoadMs: 0,
      retryWaitMs: errors.reduce((sum, e) => sum + (e.attempt * config.retry.baseDelayMs || 0), 0),
    };

    result = buildResult(context, config, status, output, confidence, errors, startTime, runId, traceId, timing, costReport);

    const confidenceSpan = startSpan('confidence.evaluate', traceId, executionSpan.spanId);
    routeByConfidence(result, config);
    endSpan(confidenceSpan.spanId);

    if (result.routingAction !== 'execute') {
      const fallbackSpan = startSpan('fallback.handle', traceId, executionSpan.spanId);
      const fallbackResult = await handleFallback({
        agentName: payload.agentName,
        runId,
        input: payload.input,
        error: errors[errors.length - 1] || { attempt: 0, timestamp: '', code: 'LOW_CONFIDENCE', message: `Confidence ${confidence} below auto-execute threshold`, recoverable: false },
        confidence,
        routingAction: result.routingAction,
      }, config);

      if (fallbackResult.handled) {
        status = 'fallback';
        result.status = 'fallback';
        result.metadata.fallback = fallbackResult;
        addSpanEvent(fallbackSpan.spanId, 'fallback_applied', fallbackResult as unknown as Record<string, unknown>);
        logger.logFallback(payload.agentName, fallbackResult.action, fallbackResult.reason);
      }
      endSpan(fallbackSpan.spanId);
    }

    if (status === 'success') {
      logger.logExecutionComplete(result);
    }

  } catch (fatalError) {
    status = 'failure';
    const errMsg = fatalError instanceof Error ? fatalError.message : String(fatalError);
    output = { error: errMsg, code: 'FATAL' };
    errors.push({ attempt: 0, timestamp: new Date().toISOString(), code: 'FATAL', message: errMsg, recoverable: false });

    if (!result) {
      result = buildResult(context, config, status, output, 0, errors, startTime, runId, traceId);
    } else {
      result.status = status;
      result.output = output;
    }

    logger.logExecutionComplete(result);
  } finally {
    endSpan(executionSpan.spanId, status === 'success' ? 'ok' : 'error');
    recordExecutionMetrics(result || buildResult(context, config, status, output, 0, errors, startTime, runId, traceId));
  }

  return result!;
}

function buildResult(
  context: RuntimeContext,
  config: RuntimeConfig,
  status: AgentStatus,
  output: unknown,
  confidence: number,
  errors: ExecutionError[],
  startTime: number,
  runId: string,
  traceId: string,
  timing?: ExecutionTiming,
  cost?: CostReport,
): ExecutionResult {
  return {
    agentName: config.agentName,
    runId,
    status,
    output,
    confidence,
    routingAction: 'execute',
    timing: timing || {
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      llmCallMs: 0,
      contextLoadMs: 0,
      retryWaitMs: 0,
    },
    cost: cost || { totalCents: 0, inputTokens: 0, outputTokens: 0, inputCostCents: 0, outputCostCents: 0, estimatedTotal: 0, budgetExceeded: false },
    errors,
    metadata: {
      sessionId: context.sessionId,
      messageCount: context.messages.length,
    },
    traceId,
  };
}
