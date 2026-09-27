import {
  assertCommunicationEnvelope,
  createDeliveryReceipt,
  type CommunicationEnvelope,
  type DeliveryReceipt,
} from "./contracts";

export type VoiceCallState =
  | "initiated"
  | "ringing"
  | "answered"
  | "completed"
  | "no_answer"
  | "failed";

export interface VoiceCallEvent {
  company_id: string;
  message_id: string;
  conversation_id: string;
  correlation_id: string;
  channel: "voice" | "call";
  participants: CommunicationEnvelope["participants"];
  provider_id: string;
  provider_call_id?: string;
  state: VoiceCallState;
  occurred_at: string;
  error_code?: string;
}

export interface VoiceCallEvidence {
  message: CommunicationEnvelope;
  receipt: DeliveryReceipt;
  call_state: VoiceCallState;
}

/**
 * Normalizes voice/call provider lifecycle evidence onto the same canonical
 * conversation and delivery contracts as text channels. A call event is
 * evidence only and never confers execution authority.
 */
export function normalizeVoiceCallEvent(event: VoiceCallEvent): VoiceCallEvidence {
  const message = assertCommunicationEnvelope({
    id: event.message_id,
    company_id: event.company_id,
    conversation_id: event.conversation_id,
    correlation_id: event.correlation_id,
    channel: event.channel,
    direction: "outbound",
    participants: event.participants,
    created_at: event.occurred_at,
    provenance: { source: "voice-provider", provider_id: event.provider_id },
  });

  const ok = event.state !== "failed" && event.state !== "no_answer";
  const receipt = createDeliveryReceipt({
    message,
    result: {
      ok,
      provider_message_id: event.provider_call_id,
      error_code: ok ? undefined : event.error_code ?? event.state,
    },
    occurred_at: event.occurred_at,
  });
  if (event.state === "completed") receipt.state = "delivered";

  return { message, receipt, call_state: event.state };
}
