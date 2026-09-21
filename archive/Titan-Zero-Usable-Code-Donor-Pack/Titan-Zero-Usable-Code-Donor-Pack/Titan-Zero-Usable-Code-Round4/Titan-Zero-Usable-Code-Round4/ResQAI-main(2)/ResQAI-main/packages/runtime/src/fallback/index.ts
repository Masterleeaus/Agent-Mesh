import type { FallbackConfig, FallbackRequest, FallbackResult, ExecutionResult, RuntimeConfig, ModelProvider } from '../types';
import { getProvider } from '../providers';
import { getLogger } from '../logger';
import { evaluateConfidence } from '../routing';

const FALLBACK_QUEUES = new Map<string, FallbackRequest[]>();

export function queueForHumanReview(request: FallbackRequest): void {
  const queueName = request.agentName;
  if (!FALLBACK_QUEUES.has(queueName)) {
    FALLBACK_QUEUES.set(queueName, []);
  }
  FALLBACK_QUEUES.get(queueName)!.push(request);
}

export function getHumanReviewQueue(agentName: string): FallbackRequest[] {
  return FALLBACK_QUEUES.get(agentName) || [];
}

export function acknowledgeFallback(agentName: string, runId: string): boolean {
  const queue = FALLBACK_QUEUES.get(agentName);
  if (!queue) return false;
  const idx = queue.findIndex(r => r.runId === runId);
  if (idx === -1) return false;
  queue.splice(idx, 1);
  return true;
}

export async function handleFallback(
  request: FallbackRequest,
  config: RuntimeConfig,
): Promise<FallbackResult> {
  const logger = getLogger();
  const fallbackCfg = config.fallback;

  if (!fallbackCfg.enabled) {
    return {
      handled: false,
      action: 'degrade',
      reason: 'Fallback disabled in config',
    };
  }

  const routingAction = request.routingAction;

  if (routingAction === 'retry' && request.error.recoverable) {
    logger.logFallback(request.agentName, 'retry', 'Recoverable error, will retry');
    return {
      handled: true,
      action: 'retry',
      reason: `Recoverable error: ${request.error.message}. Retry scheduled.`,
    };
  }

  if (routingAction === 'fallback_human' && fallbackCfg.fallbackProvider) {
    try {
      const fallbackProvider = getProvider(config.fallback.fallbackProvider || 'lemma');
      logger.logFallback(request.agentName, 'fallback_model', `Falling back to ${fallbackCfg.fallbackProvider}`);
      return {
        handled: true,
        action: 'fallback_model',
        reason: `Falling back to provider: ${fallbackCfg.fallbackProvider}`,
      };
    } catch {
      // fallback provider also failed, continue to human queue
    }
  }

  if (routingAction === 'fallback_human' || routingAction === 'escalate') {
    queueForHumanReview(request);
    logger.logFallback(request.agentName, 'human_queue', `Queued for human review`);

    const escalationTarget = routingAction === 'escalate'
      ? fallbackCfg.escalationTargets.find(t => t.role === 'ops_manager')
      : undefined;

    return {
      handled: true,
      action: routingAction === 'escalate' ? 'escalate' : 'human_queue',
      queueName: fallbackCfg.humanReviewQueue,
      assignedTo: escalationTarget?.role,
      reason: `Routed to human review. ${escalationTarget ? `Escalated to ${escalationTarget.role} via ${escalationTarget.channel}.` : ''}`,
    };
  }

  return {
    handled: false,
    action: 'degrade',
    reason: `No fallback handler for action "${routingAction}"`,
  };
}

export function getDefaultFallbackConfig(config: RuntimeConfig): FallbackConfig {
  return config.fallback;
}
