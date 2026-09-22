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
