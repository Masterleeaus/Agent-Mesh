import { describe, it, expect, beforeAll } from 'vitest';
import { ticketService } from '../src/services/ticket-service';

describe('ticketService', () => {
  beforeAll(() => {
    // Ensure mock data is loaded by calling a list first
  });

  describe('list', () => {
    it('returns paginated tickets with total count', async () => {
      const res = await ticketService.list({ page: 1, pageSize: 10 });
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.total).toBeGreaterThan(0);
      expect(res.page).toBe(1);
      expect(res.pageSize).toBe(10);
    });

    it('filters by status', async () => {
      const res = await ticketService.list({ status: ['new'] });
      res.data.forEach(t => expect(t.status).toBe('new'));
    });

    it('filters by urgency', async () => {
      const res = await ticketService.list({ urgency: ['critical'] });
      res.data.forEach(t => expect(t.urgency).toBe('critical'));
    });

    it('filters by escalated', async () => {
      const res = await ticketService.list({ isEscalated: true });
      res.data.forEach(t => expect(t.status).toBe('escalated'));
    });

    it('searches by subject', async () => {
      const res = await ticketService.list({ search: 'AC' });
      expect(res.data.length).toBeGreaterThan(0);
    });
  });

  describe('getById', () => {
    it('returns ticket detail with customer and messages', async () => {
      const detail = await ticketService.getById('tkt-001');
      expect(detail.ticket).toBeTruthy();
      expect(detail.customer).toBeTruthy();
      expect(detail.ticket.id).toBe('tkt-001');
    });

    it('throws for unknown ticket', async () => {
      await expect(ticketService.getById('nonexistent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates a new ticket and returns it', async () => {
      const ticket = await ticketService.create({
        customerId: 'cust-001',
        subject: 'Test ticket',
        message: 'This is a test',
        requestType: 'question',
        channel: 'email',
        urgency: 'low',
      });
      expect(ticket.id).toBeTruthy();
      expect(ticket.subject).toBe('Test ticket');
      expect(ticket.status).toBe('new');
    });
  });

  describe('update', () => {
    it('updates ticket fields', async () => {
      const updated = await ticketService.update('tkt-001', { urgency: 'low' });
      expect(updated.urgency).toBe('low');
    });
  });

  describe('draftReply', () => {
    it('stores draft on ticket', async () => {
      await ticketService.draftReply('tkt-001', { body: 'Draft reply text' });
      const detail = await ticketService.getById('tkt-001');
      expect(detail.ticket.draftReply).toBe('Draft reply text');
    });
  });

  describe('searchCustomers', () => {
    it('finds customers by name', async () => {
      const res = await ticketService.searchCustomers('Alice');
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data[0].name).toContain('Alice');
    });
  });

  describe('templates', () => {
    it('lists templates', async () => {
      const res = await ticketService.getTemplates();
      expect(res.data.length).toBeGreaterThan(0);
    });

    it('creates and deletes a template', async () => {
      await ticketService.createTemplate('Test', 'Test body', 'general');
      const afterCreate = await ticketService.getTemplates();
      const created = afterCreate.data.find(t => t.name === 'Test');
      expect(created).toBeTruthy();
      if (created) {
        await ticketService.deleteTemplate(created.id);
        const afterDelete = await ticketService.getTemplates();
        expect(afterDelete.data.find(t => t.id === created.id)).toBeFalsy();
      }
    });
  });

  describe('getSLAMetrics', () => {
    it('returns SLA metrics', async () => {
      const metrics = await ticketService.getSLAMetrics();
      expect(metrics.compliancePercent).toBeGreaterThan(0);
      expect(metrics.byAgent.length).toBeGreaterThan(0);
    });
  });

  describe('listAgents', () => {
    it('returns agent list', async () => {
      const agents = await ticketService.listAgents();
      expect(agents.length).toBeGreaterThan(0);
      agents.forEach(a => {
        expect(a.id).toBeTruthy();
        expect(a.name).toBeTruthy();
      });
    });
  });
});
