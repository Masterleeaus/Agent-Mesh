import type { Ticket } from '../types';
import { listRecords, updateRecord, runAgent, waitForAgentResponse, logOperation } from '../../../../packages/sdk/lemma-sdk';

export async function fetchTickets(): Promise<Ticket[]> {
  const items = await listRecords<Ticket>('tickets', 500);
  return items.sort((a: Ticket, b: Ticket) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return db - da;
  });
}

export async function updateTicket(id: string, data: Partial<Ticket>): Promise<void> {
  await updateRecord('tickets', id, data);
}

export async function classifyTicket(ticket: Ticket): Promise<void> {
  const conv = await runAgent('request-classifier', JSON.stringify({ ticket_id: ticket.id }), `Classify ticket ${ticket.id}`);
  const response = await waitForAgentResponse(conv.id);
  const parsed = JSON.parse(response);

  await updateTicket(ticket.id, {
    request_type: parsed.request_type,
    urgency: parsed.urgency,
    suggested_owner: parsed.suggested_owner,
    status: 'classified',
  });

  await logOperation('classify_ticket', `Classified ticket ${ticket.id} as ${parsed.request_type} / ${parsed.urgency}`, 'agent:request-classifier');
}

export async function draftReply(ticket: Ticket): Promise<void> {
  const conv = await runAgent('support-reply-drafter', JSON.stringify({ ticket_id: ticket.id }), `Draft reply for ticket ${ticket.id}`);
  const response = await waitForAgentResponse(conv.id);
  const parsed = JSON.parse(response);

  const updates: Partial<Ticket> = {
    draft_reply: parsed.draft_reply,
    suggested_owner: parsed.suggested_owner ?? ticket.suggested_owner,
    status: 'drafted',
  };

  await updateTicket(ticket.id, updates);
  await logOperation('draft_reply', `Drafted reply for ticket ${ticket.id}`, 'agent:support-reply-drafter');
}

export async function approveDraft(ticket: Ticket, editedReply: string): Promise<void> {
  await updateTicket(ticket.id, {
    draft_reply: editedReply,
    approved_to_send: true,
    status: 'approved_to_send',
  });

  await logOperation('approve_draft', `Approved draft for ticket ${ticket.id}`);
}

export async function markSent(ticket: Ticket): Promise<void> {
  await updateTicket(ticket.id, { status: 'sent' });
  await logOperation('mark_sent', `Marked ticket ${ticket.id} as sent`);

  try {
    const { runFunction } = await import('../../../../packages/sdk/lemma-sdk');
    await runFunction('update_ticket_record', {
      ticket_id: ticket.id,
      status: 'sent',
      approved_to_send: true,
      assigned_to: ticket.owner,
      human_notes: 'Sent via support queue app',
    });
  } catch {
    console.warn('Gmail notification trigger failed — ticket state saved');
  }
}

export async function closeTicket(ticket: Ticket): Promise<void> {
  await updateTicket(ticket.id, { status: 'closed' });
  await logOperation('close_ticket', `Closed ticket ${ticket.id}`);
}
