export const COMMUNICATION_CHANNELS = ["sms", "email", "push", "voice", "call", "messaging"] as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export type CommunicationDirection = "inbound" | "outbound";
export type DeliveryState = "queued" | "sent" | "delivered" | "failed";

export interface CommunicationParticipant {
  id?: string;
  address: string;
  display_name?: string;
}

export interface CommunicationEnvelope {
  id: string;
  company_id: string;
  conversation_id: string;
  interaction_id?: string;
  correlation_id: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  participants: CommunicationParticipant[];
  body?: string;
  created_at: string;
  provenance: {
    source: string;
    actor_id?: string;
    provider_id?: string;
  };
}

export interface DeliveryReceipt {
  company_id: string;
  message_id: string;
  conversation_id: string;
  correlation_id: string;
  channel: CommunicationChannel;
  state: DeliveryState;
  provider_message_id?: string;
  attempt: number;
  occurred_at: string;
  error_code?: string;
}

export interface OutboundCommunicationPolicy {
  consent: "granted" | "denied" | "unknown";
  opted_out: boolean;
  quiet_hours: boolean;
  channel_allowed: boolean;
  privacy_allowed: boolean;
  funding_allowed: boolean;
  authority_allowed: boolean;
}

export type OutboundPolicyDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "consent-required"
        | "opted-out"
        | "quiet-hours"
        | "channel-policy"
        | "privacy-policy"
        | "funding-policy"
        | "authority-required";
    };

export function evaluateOutboundCommunicationPolicy(
  policy: OutboundCommunicationPolicy
): OutboundPolicyDecision {
  if (policy.opted_out) return { allowed: false, reason: "opted-out" };
  if (policy.consent !== "granted") return { allowed: false, reason: "consent-required" };
  if (policy.quiet_hours) return { allowed: false, reason: "quiet-hours" };
  if (!policy.channel_allowed) return { allowed: false, reason: "channel-policy" };
  if (!policy.privacy_allowed) return { allowed: false, reason: "privacy-policy" };
  if (!policy.funding_allowed) return { allowed: false, reason: "funding-policy" };
  if (!policy.authority_allowed) return { allowed: false, reason: "authority-required" };
  return { allowed: true };
}

export function communicationIdempotencyKey(message: Pick<CommunicationEnvelope,
  "company_id" | "channel" | "correlation_id" | "id"
>): string {
  return [message.company_id, message.channel, message.correlation_id, message.id].join(":");
}

export function assertCommunicationEnvelope(
  value: CommunicationEnvelope
): CommunicationEnvelope {
  if (!value.company_id.trim()) throw new Error("company_id is required");
  if (!value.id.trim()) throw new Error("message id is required");
  if (!value.conversation_id.trim()) throw new Error("conversation_id is required");
  if (!value.correlation_id.trim()) throw new Error("correlation_id is required");
  if (!COMMUNICATION_CHANNELS.includes(value.channel)) throw new Error("unsupported channel");
  if (value.participants.length === 0) throw new Error("at least one participant is required");
  return value;
}


export interface ProviderDeliveryResult {
  ok: boolean;
  provider_message_id?: string;
  error_code?: string;
}

export function createDeliveryReceipt(params: {
  message: Pick<CommunicationEnvelope,
    "id" | "company_id" | "conversation_id" | "correlation_id" | "channel"
  >;
  result: ProviderDeliveryResult;
  attempt?: number;
  occurred_at?: string;
}): DeliveryReceipt {
  const { message, result } = params;
  return {
    company_id: message.company_id,
    message_id: message.id,
    conversation_id: message.conversation_id,
    correlation_id: message.correlation_id,
    channel: message.channel,
    state: result.ok ? "sent" : "failed",
    provider_message_id: result.provider_message_id,
    attempt: Math.max(1, params.attempt ?? 1),
    occurred_at: params.occurred_at ?? new Date().toISOString(),
    error_code: result.error_code,
  };
}


export interface CommunicationRetryPolicy {
  max_attempts: number;
  base_delay_ms: number;
  max_delay_ms: number;
}

export interface CommunicationRetryDecision {
  retry: boolean;
  next_attempt: number;
  delay_ms?: number;
  reason: "retryable-provider-failure" | "attempt-limit" | "non-retryable";
}

/**
 * Deterministic bounded retry policy. Provider failures never change authority;
 * every retry must re-enter the governed outbound path and re-check policy.
 */
export function communicationRetryDecision(input: {
  attempt: number;
  retryable: boolean;
  policy: CommunicationRetryPolicy;
}): CommunicationRetryDecision {
  const attempt = Math.max(1, input.attempt);
  const maxAttempts = Math.max(1, input.policy.max_attempts);
  if (!input.retryable) {
    return { retry: false, next_attempt: attempt, reason: "non-retryable" };
  }
  if (attempt >= maxAttempts) {
    return { retry: false, next_attempt: attempt, reason: "attempt-limit" };
  }
  const exponent = Math.max(0, attempt - 1);
  const delay = Math.min(
    Math.max(0, input.policy.max_delay_ms),
    Math.max(0, input.policy.base_delay_ms) * 2 ** exponent,
  );
  return {
    retry: true,
    next_attempt: attempt + 1,
    delay_ms: delay,
    reason: "retryable-provider-failure",
  };
}

export interface CommunicationProviderCandidate {
  provider_id: string;
  channel: CommunicationChannel;
  available: boolean;
  funded: boolean;
  policy_allowed: boolean;
}

/**
 * Provider-neutral fallback selection. Ordering is supplied by the caller's
 * configured preference; the selector cannot grant authority or funding.
 */
export function selectCommunicationProvider(
  candidates: CommunicationProviderCandidate[],
): CommunicationProviderCandidate | null {
  return candidates.find(
    (candidate) =>
      candidate.available && candidate.funded && candidate.policy_allowed,
  ) ?? null;
}


export interface CommunicationRateLimit {
  limit: number;
  used: number;
  resets_at: string;
}

export interface CommunicationRateLimitDecision {
  allowed: boolean;
  remaining: number;
  resets_at: string;
  reason?: "rate-limit-exhausted";
}

/**
 * Provider-neutral rate-limit gate. This is deliberately pure so adapters and
 * queue workers can share identical enforcement before provider execution.
 */
export function evaluateCommunicationRateLimit(
  state: CommunicationRateLimit,
): CommunicationRateLimitDecision {
  const limit = Math.max(0, state.limit);
  const used = Math.max(0, state.used);
  const remaining = Math.max(0, limit - used);
  return remaining > 0
    ? { allowed: true, remaining, resets_at: state.resets_at }
    : {
        allowed: false,
        remaining: 0,
        resets_at: state.resets_at,
        reason: "rate-limit-exhausted",
      };
}

export interface QuietHoursWindow {
  start_hour: number;
  end_hour: number;
}

/**
 * UTC/local-clock independent quiet-hour evaluation. The caller supplies the
 * recipient-local hour after applying its canonical timezone rules.
 */
export function isCommunicationQuietHour(
  recipientLocalHour: number,
  window: QuietHoursWindow,
): boolean {
  const hour = Math.min(23, Math.max(0, Math.trunc(recipientLocalHour)));
  const start = Math.min(23, Math.max(0, Math.trunc(window.start_hour)));
  const end = Math.min(23, Math.max(0, Math.trunc(window.end_hour)));
  if (start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}


export type OutboundCommunicationGateDecision =
  | { allowed: true; remaining: number }
  | {
      allowed: false;
      reason: Exclude<OutboundPolicyDecision, { allowed: true }>["reason"] | "rate-limit-exhausted";
      remaining: number;
    };

/**
 * One fail-closed pre-provider gate for outbound communications. Channel
 * adapters should call this rather than composing policy and quota checks in
 * provider-specific code.
 */
export function evaluateOutboundCommunicationGate(input: {
  policy: OutboundCommunicationPolicy;
  rate_limit: CommunicationRateLimit;
}): OutboundCommunicationGateDecision {
  const policy = evaluateOutboundCommunicationPolicy(input.policy);
  const rate = evaluateCommunicationRateLimit(input.rate_limit);
  if (!policy.allowed) {
    return { allowed: false, reason: policy.reason, remaining: rate.remaining };
  }
  if (!rate.allowed) {
    return { allowed: false, reason: "rate-limit-exhausted", remaining: 0 };
  }
  return { allowed: true, remaining: rate.remaining };
}
