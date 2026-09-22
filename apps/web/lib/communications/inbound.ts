import {
  assertCommunicationEnvelope,
  type CommunicationEnvelope,
} from "./contracts";

export type InboundRoutingKind =
  | "compliance"
  | "business"
  | "review"
  | "ignored";

export interface InboundClassification {
  kind: InboundRoutingKind;
  confidence: "high" | "medium" | "low";
  intent?: string;
  requires_human_review?: boolean;
}

export interface CanonicalInboundRouting {
  company_id: string;
  conversation_id: string;
  correlation_id: string;
  message_id: string;
  channel: CommunicationEnvelope["channel"];
  kind: InboundRoutingKind;
  intent?: string;
  requires_human_review: boolean;
  execution_authority: false;
}

/**
 * Converts provider/channel classification into canonical Interaction routing
 * evidence. Classification and routing are informational only and can never
 * grant execution authority.
 */
export function routeInboundCommunication(input: {
  message: CommunicationEnvelope;
  classification: InboundClassification;
}): CanonicalInboundRouting {
  const message = assertCommunicationEnvelope(input.message);
  if (message.direction !== "inbound") {
    throw new Error("inbound communication required");
  }
  return {
    company_id: message.company_id,
    conversation_id: message.conversation_id,
    correlation_id: message.correlation_id,
    message_id: message.id,
    channel: message.channel,
    kind: input.classification.kind,
    intent: input.classification.intent,
    requires_human_review:
      input.classification.requires_human_review === true ||
      input.classification.confidence === "low",
    execution_authority: false,
  };
}


export interface InboundProviderEvent {
  company_id: string;
  message_id: string;
  conversation_id: string;
  correlation_id: string;
  channel: CommunicationEnvelope["channel"];
  participants: CommunicationEnvelope["participants"];
  body?: string;
  occurred_at: string;
  provider_id: string;
}

/**
 * Normalizes provider webhook/input evidence into the canonical message
 * envelope before classification or workforce routing. Provider identity is
 * provenance only and never a tenant or authority boundary.
 */
export function normalizeInboundProviderEvent(
  event: InboundProviderEvent,
): CommunicationEnvelope {
  return assertCommunicationEnvelope({
    id: event.message_id,
    company_id: event.company_id,
    conversation_id: event.conversation_id,
    correlation_id: event.correlation_id,
    channel: event.channel,
    direction: "inbound",
    participants: event.participants,
    body: event.body,
    created_at: event.occurred_at,
    provenance: {
      source: "provider-inbound",
      provider_id: event.provider_id,
    },
  });
}
