import { recordDeliveryReceipt } from "@/lib/communications-log";
import { CommunicationReplayGuard } from "./idempotency";
import {
  assertCommunicationEnvelope,
  createDeliveryReceipt,
  evaluateOutboundCommunicationGate,
  selectCommunicationProvider,
  type CommunicationEnvelope,
  type CommunicationProviderCandidate,
  communicationRetryDecision,
  type CommunicationRateLimit,
  type CommunicationRetryPolicy,
  type DeliveryReceipt,
  type OutboundCommunicationPolicy,
  type ProviderDeliveryResult,
} from "./contracts";

export interface CommunicationProviderAdapter {
  provider_id: string;
  send(message: CommunicationEnvelope): Promise<ProviderDeliveryResult>;
}

export type GovernedOutboundResult =
  | { ok: false; denied: true; reason: string }
  | { ok: false; denied: false; reason: "duplicate" }
  | { ok: false; denied: false; reason: "no-provider"; receipt: DeliveryReceipt; persisted: boolean }
  | { ok: false; denied: false; reason: "provider-failed"; provider_id: string; receipt: DeliveryReceipt; persisted: boolean; retry?: { next_attempt: number; delay_ms: number } }
  | { ok: true; provider_id: string; receipt: DeliveryReceipt; persisted: boolean };

export interface ProviderAttemptEvidence { provider_id: string; receipt: DeliveryReceipt; persisted: boolean; }

const outboundReplayGuard = new CommunicationReplayGuard();

/**
 * Canonical pre-provider orchestration seam. Authority is supplied by the
 * canonical authority/Command Bus boundary; this module only verifies it and
 * cannot mint authority itself.
 */
export async function executeGovernedOutbound(input: {
  message: CommunicationEnvelope;
  policy: OutboundCommunicationPolicy;
  rate_limit: CommunicationRateLimit;
  candidates: CommunicationProviderCandidate[];
  adapters: CommunicationProviderAdapter[];
  attempt?: number;
  retry_policy?: CommunicationRetryPolicy;
}): Promise<GovernedOutboundResult> {
  const message = assertCommunicationEnvelope(input.message);
  if (!outboundReplayGuard.claim(message)) {
    return { ok: false, denied: false, reason: "duplicate" };
  }
  const gate = evaluateOutboundCommunicationGate({
    policy: input.policy,
    rate_limit: input.rate_limit,
  });
  if (!gate.allowed) {
    outboundReplayGuard.release(message);
    return { ok: false, denied: true, reason: gate.reason };
  }

  const candidate = selectCommunicationProvider(
    input.candidates.filter((item) => item.channel === message.channel),
  );
  if (!candidate) {
    const receipt = createDeliveryReceipt({
      message,
      result: { ok: false, error_code: "no-provider" },
      attempt: input.attempt,
    });
    return { ok: false, denied: false, reason: "no-provider", receipt, persisted: await recordDeliveryReceipt(receipt) };
  }

  const adapter = input.adapters.find((item) => item.provider_id === candidate.provider_id);
  if (!adapter) {
    const receipt = createDeliveryReceipt({
      message,
      result: { ok: false, error_code: "provider-adapter-missing" },
      attempt: input.attempt,
    });
    return { ok: false, denied: false, reason: "no-provider", receipt, persisted: await recordDeliveryReceipt(receipt) };
  }

  const providerResult = await adapter.send(message);
  const receipt = createDeliveryReceipt({
    message,
    result: providerResult,
    attempt: input.attempt,
  });
  const persisted = await recordDeliveryReceipt(receipt);
  if (providerResult.ok) {
    return { ok: true, provider_id: candidate.provider_id, receipt, persisted };
  }

  const retry = input.retry_policy
    ? communicationRetryDecision({
        attempt: input.attempt ?? 1,
        retryable: true,
        policy: input.retry_policy,
      })
    : null;
  return {
    ok: false,
    denied: false,
    reason: "provider-failed",
    provider_id: candidate.provider_id,
    receipt,
    persisted,
    ...(retry?.retry && retry.delay_ms !== undefined
      ? { retry: { next_attempt: retry.next_attempt, delay_ms: retry.delay_ms } }
      : {}),
  };
}


/**
 * Governed provider fallback. Every provider attempt stays inside the same
 * already-authorized message execution and produces evidence. Fallback cannot
 * cross channels or use unfunded/policy-blocked providers.
 */
export async function executeGovernedOutboundWithFallback(input: {
  message: CommunicationEnvelope;
  policy: OutboundCommunicationPolicy;
  rate_limit: CommunicationRateLimit;
  candidates: CommunicationProviderCandidate[];
  adapters: CommunicationProviderAdapter[];
  attempt?: number;
}): Promise<{
  result: GovernedOutboundResult;
  attempts: ProviderAttemptEvidence[];
}> {
  const message = assertCommunicationEnvelope(input.message);
  const gate = evaluateOutboundCommunicationGate({
    policy: input.policy,
    rate_limit: input.rate_limit,
  });
  if (!gate.allowed) {
    return { result: { ok: false, denied: true, reason: gate.reason }, attempts: [] };
  }

  const eligible = input.candidates.filter(
    (candidate) =>
      candidate.channel === message.channel &&
      candidate.available &&
      candidate.funded &&
      candidate.policy_allowed,
  );
  const attempts: ProviderAttemptEvidence[] = [];

  for (const candidate of eligible) {
    const adapter = input.adapters.find((item) => item.provider_id === candidate.provider_id);
    if (!adapter) continue;
    const providerResult = await adapter.send(message);
    const receipt = createDeliveryReceipt({
      message,
      result: providerResult,
      attempt: input.attempt,
    });
    const persisted = await recordDeliveryReceipt(receipt);
    attempts.push({ provider_id: candidate.provider_id, receipt, persisted });
    if (providerResult.ok) {
      return {
        result: { ok: true, provider_id: candidate.provider_id, receipt, persisted },
        attempts,
      };
    }
  }

  const last = attempts[attempts.length - 1];
  if (last) {
    return {
      result: {
        ok: false,
        denied: false,
        reason: "provider-failed",
        provider_id: last.provider_id,
        receipt: last.receipt,
        persisted: last.persisted,
      },
      attempts,
    };
  }

  return {
    result: await (async () => {
      const receipt = createDeliveryReceipt({
        message,
        result: { ok: false, error_code: "no-provider" },
        attempt: input.attempt,
      });
      return {
        ok: false as const,
        denied: false as const,
        reason: "no-provider" as const,
        receipt,
        persisted: await recordDeliveryReceipt(receipt),
      };
    })(),
    attempts,
  };
}
