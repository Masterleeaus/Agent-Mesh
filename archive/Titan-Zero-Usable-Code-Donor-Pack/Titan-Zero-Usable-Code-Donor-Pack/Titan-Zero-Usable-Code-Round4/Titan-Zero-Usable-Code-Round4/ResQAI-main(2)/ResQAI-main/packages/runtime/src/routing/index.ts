import type { RuntimeConfig, ExecutionResult, ConfidenceResult, RoutingAction, ConfidenceLevel } from '../types';
import { getLogger } from '../logger';

export function evaluateConfidence(
  rawConfidence: number,
  config: RuntimeConfig,
): ConfidenceResult {
  const thresholds = config.routing.confidenceThresholds;
  let action: RoutingAction;
  let reasoning: string;

  if (rawConfidence >= thresholds.autoExecute) {
    action = 'execute';
    reasoning = `Confidence ${rawConfidence} >= auto-execute threshold ${thresholds.autoExecute}`;
  } else if (rawConfidence >= thresholds.requireReview) {
    action = 'fallback_human';
    reasoning = `Confidence ${rawConfidence} between require-review (${thresholds.requireReview}) and auto-execute (${thresholds.autoExecute})`;
  } else if (rawConfidence >= thresholds.escalate) {
    action = 'escalate';
    reasoning = `Confidence ${rawConfidence} between escalate (${thresholds.escalate}) and require-review (${thresholds.requireReview})`;
  } else if (rawConfidence >= thresholds.fallback) {
    action = 'fallback_human';
    reasoning = `Confidence ${rawConfidence} between fallback (${thresholds.fallback}) and escalate (${thresholds.escalate})`;
  } else {
    action = 'degrade';
    reasoning = `Confidence ${rawConfidence} < fallback threshold ${thresholds.fallback}`;
  }

  return {
    score: Math.max(0, Math.min(1, rawConfidence)) as ConfidenceLevel,
    action,
    reasoning,
    thresholds,
  };
}

export function canAutoExecute(result: ConfidenceResult): boolean {
  return result.action === 'execute';
}

export function requiresHumanReview(result: ConfidenceResult): boolean {
  return result.action === 'fallback_human' || result.action === 'escalate';
}

export function routeByConfidence(
  result: ExecutionResult,
  config: RuntimeConfig,
): ExecutionResult {
  if (!config.routing.enabled) {
    result.routingAction = 'execute';
    return result;
  }

  const confidence = evaluateConfidence(result.confidence, config);
  result.routingAction = confidence.action;

  if (result.status === 'success' && confidence.action !== 'execute') {
    const logger = getLogger();
    logger.info('confidence_routing_override', {
      agent: result.agentName,
      runId: result.runId,
      confidence: result.confidence,
      action: confidence.action,
      reasoning: confidence.reasoning,
    });
  }

  return result;
}

export function shouldDegradeModel(config: RuntimeConfig, costExceeded: boolean): boolean {
  return config.routing.degradeOnCost && costExceeded;
}
