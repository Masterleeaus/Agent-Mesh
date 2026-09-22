import {
  assertCommunicationEnvelope,
  createDeliveryReceipt,
  evaluateOutboundCommunicationGate,
  selectCommunicationProvider,
  type CommunicationEnvelope,
  type CommunicationProviderCandidate,
  type CommunicationRateLimit,
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
  | { ok: false; denied: false; reason: "no-provider"; receipt: DeliveryReceipt }
  | { ok: true; provider_id: string; receipt: DeliveryReceipt };

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
}): Promise<GovernedOutboundResult> {
  const message = assertCommunicationEnvelope(input.message);
  const gate = evaluateOutboundCommunicationGate({
    policy: input.policy,
    rate_limit: input.rate_limit,
  });
  if (!gate.allowed) return { ok: false, denied: true, reason: gate.reason };

  const candidate = selectCommunicationProvider(
    input.candidates.filter((item) => item.channel === message.channel),
  );
  if (!candidate) {
    return {
      ok: false,
      denied: false,
      reason: "no-provider",
      receipt: createDeliveryReceipt({
        message,
        result: { ok: false, error_code: "no-provider" },
        attempt: input.attempt,
      }),
    };
  }

  const adapter = input.adapters.find((item) => item.provider_id === candidate.provider_id);
  if (!adapter) {
    return {
      ok: false,
      denied: false,
      reason: "no-provider",
      receipt: createDeliveryReceipt({
        message,
        result: { ok: false, error_code: "provider-adapter-missing" },
        attempt: input.attempt,
      }),
    };
  }

  const providerResult = await adapter.send(message);
  return {
    ok: providerResult.ok,
    provider_id: candidate.provider_id,
    receipt: createDeliveryReceipt({
      message,
      result: providerResult,
      attempt: input.attempt,
    }),
  } as GovernedOutboundResult;
}
