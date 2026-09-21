import type { TicketListResponse, TicketDetailResponse, CustomerSearchResponse, SLAMetricsResponse, TemplateListResponse } from '../models/api-responses';
import type { TicketDTO } from '../models/dto';
import type { CreateTicketRequest, UpdateTicketRequest, DraftReplyRequest, ApproveReplyRequest, EscalateTicketRequest, TicketListFilters } from '../models/api-requests';
import { mockTickets, mockCustomers, mockTemplates, mockMessages, mockTimelines, mockSLAMetrics, mockAgents } from './mock-data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function applyFilters(tickets: TicketDTO[], filters?: TicketListFilters): TicketDTO[] {
  if (!filters) return tickets;
  let filtered = [...tickets];

  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(t => filters.status!.includes(t.status));
  }
  if (filters.urgency && filters.urgency.length > 0) {
    filtered = filtered.filter(t => filters.urgency!.includes(t.urgency));
  }
  if (filters.requestType && filters.requestType.length > 0) {
    filtered = filtered.filter(t => filters.requestType!.includes(t.requestType));
  }
  if (filters.channel && filters.channel.length > 0) {
    filtered = filtered.filter(t => filters.channel!.includes(t.channel));
  }
  if (filters.ownerId) {
    if (filters.ownerId === '@me') {
      filtered = filtered.filter(t => t.ownerId);
    } else {
      filtered = filtered.filter(t => t.ownerId === filters.ownerId);
    }
  }
  if (filters.isEscalated) {
    filtered = filtered.filter(t => t.status === 'escalated');
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(t =>
      t.subject.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q) ||
      t.message.toLowerCase().includes(q)
    );
  }

  return filtered;
}

export const ticketService = {
  async list(filters?: TicketListFilters): Promise<TicketListResponse> {
    await delay(300);
    const filtered = applyFilters(mockTickets, filters);
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return { data: paged, total: filtered.length, page, pageSize };
  },

  async getById(id: string): Promise<TicketDetailResponse> {
    await delay(200);
    const ticket = mockTickets.find(t => t.id === id);
    if (!ticket) throw new Error(`Ticket ${id} not found`);
    const customer = mockCustomers.find(c => c.id === ticket.customerId) || mockCustomers[0];
    const messages = mockMessages[id] || [];
    const timeline = mockTimelines[id] || [];
    return {
      ticket,
      customer,
      messages,
      timeline,
      relatedAppointments: [],
      relatedDisputes: [],
    };
  },

  async create(req: CreateTicketRequest): Promise<TicketDTO> {
    await delay(400);
    const newTicket: TicketDTO = {
      id: `tkt-${String(mockTickets.length + 1).padStart(3, '0')}`,
      customerId: req.customerId,
      customerName: req.customerId,
      subject: req.subject,
      message: req.message,
      requestType: req.requestType,
      channel: req.channel,
      urgency: req.urgency,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTickets.unshift(newTicket);
    return newTicket;
  },

  async update(id: string, req: UpdateTicketRequest): Promise<TicketDTO> {
    await delay(300);
    const ticket = mockTickets.find(t => t.id === id);
    if (!ticket) throw new Error(`Ticket ${id} not found`);
    Object.assign(ticket, req, { updatedAt: new Date().toISOString() });
    return ticket;
  },

  async draftReply(id: string, req: DraftReplyRequest): Promise<void> {
    await delay(200);
    const ticket = mockTickets.find(t => t.id === id);
    if (ticket) {
      ticket.draftReply = req.body;
      ticket.updatedAt = new Date().toISOString();
    }
  },

  async approveReply(id: string, req: ApproveReplyRequest): Promise<void> {
    await delay(200);
    const ticket = mockTickets.find(t => t.id === id);
    if (ticket) {
      ticket.draftReply = req.body;
      ticket.updatedAt = new Date().toISOString();
    }
  },

  async escalate(id: string, req: EscalateTicketRequest): Promise<void> {
    await delay(300);
    const ticket = mockTickets.find(t => t.id === id);
    if (ticket) {
      ticket.status = 'escalated';
      ticket.escalationReason = req.reason;
      ticket.escalatedTo = req.escalateTo;
      ticket.updatedAt = new Date().toISOString();
    }
  },

  async searchCustomers(q: string): Promise<CustomerSearchResponse> {
    await delay(200);
    const query = q.toLowerCase();
    const results = mockCustomers.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
    );
    return { data: results, total: results.length };
  },

  async getSLAMetrics(): Promise<SLAMetricsResponse> {
    await delay(300);
    return { ...mockSLAMetrics, byAgent: [...mockSLAMetrics.byAgent] };
  },

  async getTemplates(): Promise<TemplateListResponse> {
    await delay(200);
    return { data: [...mockTemplates], total: mockTemplates.length };
  },

  async createTemplate(name: string, body: string, category: string): Promise<void> {
    await delay(300);
    const tpl = {
      id: `tpl-${String(mockTemplates.length + 1).padStart(3, '0')}`,
      name, body, category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTemplates.push(tpl);
  },

  async updateTemplate(id: string, name: string, body: string, category: string): Promise<void> {
    await delay(300);
    const tpl = mockTemplates.find(t => t.id === id);
    if (tpl) {
      tpl.name = name;
      tpl.body = body;
      tpl.category = category;
      tpl.updatedAt = new Date().toISOString();
    }
  },

  async deleteTemplate(id: string): Promise<void> {
    await delay(200);
    const idx = mockTemplates.findIndex(t => t.id === id);
    if (idx >= 0) mockTemplates.splice(idx, 1);
  },

  async listAgents(): Promise<{ id: string; name: string }[]> {
    await delay(100);
    return mockAgents.map(a => ({ id: a.id, name: a.name }));
  },
};
