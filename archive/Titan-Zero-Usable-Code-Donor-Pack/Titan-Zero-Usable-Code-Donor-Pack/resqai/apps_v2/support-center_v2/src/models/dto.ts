export type RequestType = 'question' | 'problem' | 'feature_request' | 'billing' | 'other';
export type Channel = 'phone' | 'email' | 'chat' | 'portal' | 'social';
export type Urgency = 'low' | 'normal' | 'high' | 'critical';
export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed' | 'escalated';

export interface TicketDTO {
  id: string;
  customerId: string;
  customerName: string;
  subject: string;
  message: string;
  requestType: RequestType;
  channel: Channel;
  urgency: Urgency;
  status: TicketStatus;
  ownerId?: string;
  ownerName?: string;
  draftReply?: string;
  classifiedType?: string;
  classificationConfidence?: number;
  escalationReason?: string;
  escalatedTo?: string;
  slaDeadline?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  accountId?: string;
  accountName?: string;
  createdAt: string;
}

export interface AgentDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  isOnline: boolean;
}

export interface TemplateDTO {
  id: string;
  name: string;
  body: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDTO {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: 'customer' | 'agent' | 'system';
  body: string;
  createdAt: string;
}

export interface TimelineEventDTO {
  id: string;
  ticketId: string;
  type: string;
  description: string;
  actorName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
