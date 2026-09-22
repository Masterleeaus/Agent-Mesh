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
