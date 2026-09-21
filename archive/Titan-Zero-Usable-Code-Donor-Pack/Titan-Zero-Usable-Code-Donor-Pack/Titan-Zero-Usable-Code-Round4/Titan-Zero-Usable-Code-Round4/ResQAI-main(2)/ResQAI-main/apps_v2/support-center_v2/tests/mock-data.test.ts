import { describe, it, expect } from 'vitest';
import { mockTickets, mockCustomers, mockTemplates, mockMessages, mockTimelines, mockSLAMetrics, mockAgents } from '../src/services/mock-data';

describe('mock-data', () => {
  it('has realistic tickets', () => {
    expect(mockTickets.length).toBeGreaterThanOrEqual(8);
    mockTickets.forEach(t => {
      expect(t.id).toBeTruthy();
      expect(t.subject).toBeTruthy();
      expect(t.status).toBeTruthy();
      expect(['new', 'open', 'pending', 'resolved', 'closed', 'escalated']).toContain(t.status);
      expect(['low', 'normal', 'high', 'critical']).toContain(t.urgency);
    });
  });

  it('has customers referenced by tickets', () => {
    const customerIds = new Set(mockCustomers.map(c => c.id));
    mockTickets.forEach(t => {
      expect(customerIds.has(t.customerId)).toBe(true);
    });
  });

  it('has valid templates', () => {
    expect(mockTemplates.length).toBeGreaterThanOrEqual(4);
    mockTemplates.forEach(t => {
      expect(t.id).toMatch(/^tpl-/);
      expect(t.body).toBeTruthy();
      expect(t.category).toBeTruthy();
    });
  });

  it('has messages for tickets that need them', () => {
    const ticketsWithMessages = Object.keys(mockMessages);
    expect(ticketsWithMessages.length).toBeGreaterThanOrEqual(5);
    Object.entries(mockMessages).forEach(([ticketId, messages]) => {
      expect(mockTickets.some(t => t.id === ticketId)).toBe(true);
      messages.forEach(m => {
        expect(m.ticketId).toBe(ticketId);
        expect(m.body).toBeTruthy();
        expect(['customer', 'agent', 'system']).toContain(m.authorRole);
      });
    });
  });

  it('has timelines for key tickets', () => {
    const ticketsWithTimelines = Object.keys(mockTimelines);
    expect(ticketsWithTimelines.length).toBeGreaterThanOrEqual(5);
    Object.entries(mockTimelines).forEach(([ticketId, events]) => {
      expect(mockTickets.some(t => t.id === ticketId)).toBe(true);
      events.forEach(e => {
        expect(e.description).toBeTruthy();
        expect(e.type).toBeTruthy();
      });
    });
  });

  it('has SLA metrics', () => {
    expect(mockSLAMetrics.compliancePercent).toBeGreaterThan(0);
    expect(mockSLAMetrics.byAgent.length).toBeGreaterThan(0);
    mockSLAMetrics.byAgent.forEach(a => {
      expect(a.agentName).toBeTruthy();
      expect(a.compliancePercent).toBeGreaterThanOrEqual(0);
      expect(a.compliancePercent).toBeLessThanOrEqual(100);
    });
    expect(Object.keys(mockSLAMetrics.avgResponseTimeByChannel).length).toBeGreaterThan(0);
  });

  it('has valid agents', () => {
    expect(mockAgents.length).toBeGreaterThanOrEqual(3);
    mockAgents.forEach(a => {
      expect(a.id).toMatch(/^agent-/);
      expect(a.name).toBeTruthy();
    });
  });
});
