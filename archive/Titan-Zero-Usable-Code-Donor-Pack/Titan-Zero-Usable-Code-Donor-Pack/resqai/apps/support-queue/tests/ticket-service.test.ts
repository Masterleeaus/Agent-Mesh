import { describe, it, expect, vi } from 'vitest';
import {
  fetchTickets,
  updateTicket,
  classifyTicket,
  draftReply,
  approveDraft,
  markSent,
  closeTicket,
} from '../src/services/ticket-service';

vi.mock('../../../packages/sdk/lemma-sdk', () => ({
  initLemmaClient: vi.fn(),
  getClient: vi.fn(),
  listRecords: vi.fn(),
  updateRecord: vi.fn(),
  runAgent: vi.fn().mockResolvedValue({ id: 'conv-1' }),
  waitForAgentResponse: vi.fn(),
  logOperation: vi.fn(),
}));

import { listRecords, updateRecord, runAgent, waitForAgentResponse } from '../../../packages/sdk/lemma-sdk';

describe('fetchTickets', () => {
  it('returns tickets sorted by created_at descending', async () => {
    vi.mocked(listRecords).mockResolvedValue([
      { id: '1', created_at: '2026-06-20T00:00:00Z' },
      { id: '2', created_at: '2026-06-25T00:00:00Z' },
      { id: '3', created_at: '2026-06-22T00:00:00Z' },
    ]);

    const tickets = await fetchTickets();
    expect(tickets[0].id).toBe('2');
    expect(tickets[1].id).toBe('3');
    expect(tickets[2].id).toBe('1');
  });

  it('handles empty result', async () => {
    vi.mocked(listRecords).mockResolvedValue([]);

    const tickets = await fetchTickets();
    expect(tickets).toEqual([]);
  });
});

describe('updateTicket', () => {
  it('calls updateRecord with correct params', async () => {
    await updateTicket('ticket-1', { status: 'closed' });
    expect(updateRecord).toHaveBeenCalledWith('tickets', 'ticket-1', { status: 'closed' });
  });
});

describe('classifyTicket', () => {
  it('calls agent and updates ticket', async () => {
    vi.mocked(waitForAgentResponse).mockResolvedValue(
      '{"request_type":"billing","urgency":"high","suggested_owner":"Alice"}',
    );

    const ticket = { id: 'ticket-1', channel: 'email', subject: 'Test', message: 'Help' } as any;
    await classifyTicket(ticket);

    expect(runAgent).toHaveBeenCalledWith(
      'request-classifier',
      JSON.stringify({ ticket_id: 'ticket-1' }),
      'Classify ticket ticket-1',
    );
    expect(updateRecord).toHaveBeenCalledWith('tickets', 'ticket-1', {
      request_type: 'billing',
      urgency: 'high',
      suggested_owner: 'Alice',
      status: 'classified',
    });
  });
});

describe('draftReply', () => {
  it('calls agent and updates ticket with draft', async () => {
    vi.mocked(waitForAgentResponse).mockResolvedValue(
      '{"draft_reply":"Thank you for your inquiry...","suggested_owner":"Bob","draft_status":"ready"}',
    );

    const ticket = { id: 'ticket-1', suggested_owner: 'Alice' } as any;
    await draftReply(ticket);

    expect(updateRecord).toHaveBeenCalledWith('tickets', 'ticket-1', {
      draft_reply: 'Thank you for your inquiry...',
      suggested_owner: 'Bob',
      status: 'drafted',
    });
  });

  it('preserves existing suggested_owner if not in response', async () => {
    vi.mocked(waitForAgentResponse).mockResolvedValue(
      '{"draft_reply":"Thanks!","draft_status":"ready"}',
    );

    const ticket = { id: 'ticket-1', suggested_owner: 'Alice' } as any;
    await draftReply(ticket);

    expect(updateRecord).toHaveBeenCalledWith('tickets', 'ticket-1', {
      draft_reply: 'Thanks!',
      suggested_owner: 'Alice',
      status: 'drafted',
    });
  });
});

describe('approveDraft', () => {
  it('updates ticket with edited reply and status', async () => {
    const ticket = { id: 'ticket-1' } as any;
    await approveDraft(ticket, 'Edited reply text');
    expect(updateRecord).toHaveBeenCalledWith('tickets', 'ticket-1', {
      draft_reply: 'Edited reply text',
      approved_to_send: true,
      status: 'approved_to_send',
    });
  });
});

describe('markSent', () => {
  it('sets status to sent', async () => {
    const ticket = { id: 'ticket-1' } as any;
    await markSent(ticket);
    expect(updateRecord).toHaveBeenCalledWith('tickets', 'ticket-1', { status: 'sent' });
  });
});

describe('closeTicket', () => {
  it('sets status to closed', async () => {
    const ticket = { id: 'ticket-1' } as any;
    await closeTicket(ticket);
    expect(updateRecord).toHaveBeenCalledWith('tickets', 'ticket-1', { status: 'closed' });
  });
});
