import type { TicketDTO, CustomerDTO, MessageDTO, TimelineEventDTO, RequestType, Channel, Urgency, TicketStatus } from './dto';

export interface TicketListItem {
  id: string;
  subject: string;
  customerName: string;
  requestType: RequestType;
  channel: Channel;
  urgency: Urgency;
  status: TicketStatus;
  ownerName?: string;
  slaRemaining?: number;
  age: number;
  hasDraft: boolean;
  isEscalated: boolean;
}

export interface MessageVM {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'customer' | 'agent' | 'system';
  body: string;
  createdAt: string;
}

export interface TimelineEventVM {
  id: string;
  type: string;
  description: string;
  actorName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TicketDetailVM {
  ticket: TicketDTO;
  customer: CustomerDTO;
  messages: MessageVM[];
  timeline: TimelineEventVM[];
  relatedAppointments: unknown[];
  relatedDisputes: unknown[];
}

export interface AgentSLAMetricVM {
  id: string;
  agentId: string;
  agentName: string;
  totalTickets: number;
  breached: number;
  compliancePercent: number;
}

export interface SLAMetricsVM {
  compliancePercent: number;
  breached: number;
  total: number;
  avgResponseTimeByChannel: Record<string, number>;
  byAgent: AgentSLAMetricVM[];
}
