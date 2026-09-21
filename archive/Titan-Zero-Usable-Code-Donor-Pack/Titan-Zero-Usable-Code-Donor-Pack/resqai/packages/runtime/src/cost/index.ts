import type { CostConfig, CostReport, RuntimeConfig, ExecutionResult } from '../types';

interface CostTrackerState {
  sessionTotalCents: number;
  runCount: number;
  alerted: boolean;
}

const sessionTrackers = new Map<string, CostTrackerState>();

export function getCostTracker(agentName: string): CostTrackerState {
  if (!sessionTrackers.has(agentName)) {
    sessionTrackers.set(agentName, { sessionTotalCents: 0, runCount: 0, alerted: false });
  }
  return sessionTrackers.get(agentName)!;
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  config: RuntimeConfig,
): CostReport {
  const model = config.model || config.provider;
  const rates = config.cost.modelRates;

  const modelRate = rates[model] || rates[config.provider] || { inputPer1K: 0.003, outputPer1K: 0.015 };

  const inputCostCents = (inputTokens / 1000) * modelRate.inputPer1K * 100;
  const outputCostCents = (outputTokens / 1000) * modelRate.outputPer1K * 100;
  const totalCents = inputCostCents + outputCostCents;

  return {
    totalCents,
    inputTokens,
    outputTokens,
    inputCostCents,
    outputCostCents,
    estimatedTotal: totalCents / 100,
    budgetExceeded: false,
  };
}

export function checkBudget(config: RuntimeConfig, cost: CostReport): { allowed: boolean; alert: boolean } {
  if (!config.cost.enabled) return { allowed: true, alert: false };

  const tracker = getCostTracker(config.agentName);
  const newTotal = tracker.sessionTotalCents + cost.totalCents;

  if (newTotal >= config.cost.budgetCents) {
    return { allowed: false, alert: false };
  }

  const ratio = newTotal / config.cost.budgetCents;
  if (ratio >= config.cost.alertThreshold && !tracker.alerted) {
    return { allowed: true, alert: true };
  }

  return { allowed: true, alert: false };
}

export function trackCost(config: RuntimeConfig, cost: CostReport): void {
  if (!config.cost.enabled) return;
  const tracker = getCostTracker(config.agentName);
  tracker.sessionTotalCents += cost.totalCents;
  tracker.runCount += 1;
  cost.budgetExceeded = tracker.sessionTotalCents >= config.cost.budgetCents;
}

export function getSessionCost(agentName: string): { totalCents: number; runCount: number; budgetCents: number } {
  const config = { cost: { budgetCents: 10_000 } } as RuntimeConfig;
  const tracker = getCostTracker(agentName);
  return {
    totalCents: tracker.sessionTotalCents,
    runCount: tracker.runCount,
    budgetCents: config.cost.budgetCents,
  };
}

export function resetSessionCost(agentName?: string): void {
  if (agentName) {
    sessionTrackers.delete(agentName);
  } else {
    sessionTrackers.clear();
  }
}

export function estimateRunCost(messages: unknown[], outputTokens: number, config: RuntimeConfig): CostReport {
  const inputStr = JSON.stringify(messages);
  const inputTokens = Math.ceil(inputStr.length / 4);
  return calculateCost(inputTokens, outputTokens, config);
}
