import type { TicketDTO } from '../models/dto';

export const SUPPORT_CENTER_EVENTS = {
  TICKET_CREATED: 'ticket.created',
  TICKET_CLASSIFIED: 'ticket.classified',
  TICKET_REPLY_DRAFTED: 'ticket.reply.drafted',
  TICKET_REPLY_APPROVED: 'ticket.reply.approved',
  TICKET_STATUS_CHANGED: 'ticket.status.changed',
  TICKET_ESCALATED: 'ticket.escalated',
} as const;

export type SupportCenterEventName = typeof SUPPORT_CENTER_EVENTS[keyof typeof SUPPORT_CENTER_EVENTS];

export interface TicketCreatedPayload {
  ticket: TicketDTO;
}

export interface TicketClassifiedPayload {
  ticketId: string;
  classifiedType: string;
  confidence: number;
}

export interface TicketReplyDraftedPayload {
  ticketId: string;
  replyBody: string;
}

export interface TicketReplyApprovedPayload {
  ticketId: string;
  replyBody: string;
}

export interface TicketStatusChangedPayload {
  ticketId: string;
  previousStatus: string;
  newStatus: string;
}

export interface TicketEscalatedPayload {
  ticketId: string;
  reason: string;
  escalatedTo?: string;
}

export type SupportCenterEventPayload =
  | TicketCreatedPayload
  | TicketClassifiedPayload
  | TicketReplyDraftedPayload
  | TicketReplyApprovedPayload
  | TicketStatusChangedPayload
  | TicketEscalatedPayload;

export type SupportCenterEvent = {
  [K in SupportCenterEventName]: { type: K; payload: Extract<SupportCenterEventPayload, Record<string, unknown>> };
}[SupportCenterEventName];
