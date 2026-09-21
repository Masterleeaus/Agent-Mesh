import type { RequestType, Channel, Urgency } from './dto';

export interface CreateTicketRequest {
  customerId: string;
  subject: string;
  message: string;
  requestType: RequestType;
  channel: Channel;
  urgency: Urgency;
  phone?: string;
  email?: string;
}

export interface UpdateTicketRequest {
  subject?: string;
  requestType?: RequestType;
  urgency?: Urgency;
  status?: import('./dto').TicketStatus;
  ownerId?: string;
}

export interface DraftReplyRequest {
  body: string;
}

export interface ApproveReplyRequest {
  replyId: string;
  body: string;
}

export interface EscalateTicketRequest {
  reason: string;
  escalateTo?: string;
}

export interface SearchCustomersRequest {
  query: string;
  limit?: number;
}

export interface TicketListFilters {
  status?: import('./dto').TicketStatus[];
  urgency?: Urgency[];
  requestType?: RequestType[];
  channel?: Channel[];
  ownerId?: string;
  search?: string;
  isEscalated?: boolean;
  page?: number;
  pageSize?: number;
}
