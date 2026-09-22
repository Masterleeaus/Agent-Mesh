import type { CommunicationEnvelope, DeliveryReceipt } from "./contracts";

export interface CommunicationThread {
  company_id: string;
  conversation_id: string;
  messages: Array<CommunicationEnvelope & { delivery_state?: DeliveryReceipt["state"] }>;
}

/**
 * Provider-neutral inbox projection. It derives a thread from canonical message
 * evidence and receipts; it does not own or duplicate conversation state.
 */
export function projectCommunicationThread(input: {
  company_id: string;
  conversation_id: string;
  messages: CommunicationEnvelope[];
  receipts?: DeliveryReceipt[];
}): CommunicationThread {
  const messages = input.messages.filter(
    (message) =>
      message.company_id === input.company_id &&
      message.conversation_id === input.conversation_id,
  );
  const receiptByMessage = new Map(
    (input.receipts ?? [])
      .filter(
        (receipt) =>
          receipt.company_id === input.company_id &&
          receipt.conversation_id === input.conversation_id,
      )
      .map((receipt) => [receipt.message_id, receipt] as const),
  );

  return {
    company_id: input.company_id,
    conversation_id: input.conversation_id,
    messages: messages
      .map((message) => ({
        ...message,
        delivery_state: receiptByMessage.get(message.id)?.state,
      }))
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}
