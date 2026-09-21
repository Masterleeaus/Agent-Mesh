import React, { useState, memo } from 'react';
import type { Ticket } from '../types';
import { URGENCY_VARIANTS } from '../../../../packages/config/constants';
import { errorMessage } from '../../../../packages/utils/service-helpers';
import { classifyTicket, draftReply, approveDraft, markSent, closeTicket } from '../services/ticket-service';

interface TicketDetailProps {
  ticket: Ticket;
  onUpdate: (id: string, patch: Partial<Ticket>) => void;
  onRefresh: () => Promise<void>;
}

export const TicketDetail = memo(function TicketDetail({ ticket, onUpdate, onRefresh }: TicketDetailProps) {
  const [editedReply, setEditedReply] = useState(ticket.draft_reply ?? '');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setEditedReply(ticket.draft_reply ?? '');
  }, [ticket.id, ticket.draft_reply]);

  React.useEffect(() => {
    setError(null);
  }, [ticket.id]);

  const isClosed = ticket.status === 'closed' || ticket.status === 'sent';

  async function handleClassify() {
    setBusy('classify');
    setError(null);
    try {
      await classifyTicket(ticket);
      await onRefresh();
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleDraft() {
    setBusy('draft');
    setError(null);
    try {
      await draftReply(ticket);
      await onRefresh();
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleApprove() {
    setBusy('approve');
    setError(null);
    try {
      await approveDraft(ticket, editedReply);
      onUpdate(ticket.id, { status: 'approved_to_send', approved_to_send: true, draft_reply: editedReply });
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleMarkSent() {
    setBusy('mark-sent');
    setError(null);
    try {
      await markSent(ticket);
      onUpdate(ticket.id, { status: 'sent' });
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleClose() {
    setBusy('close');
    setError(null);
    try {
      await closeTicket(ticket);
      onUpdate(ticket.id, { status: 'closed' });
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const canClassify = ticket.status === 'new';
  const canDraft = ['classified', 'drafted'].includes(ticket.status);
  const canApprove = !!ticket.draft_reply && ['classified', 'drafted'].includes(ticket.status) && !ticket.approved_to_send;
  const canMarkSent = ticket.status === 'approved_to_send';
  const canClose = !isClosed;

  return (
    <div style={styles.panel}>
      <h2 style={styles.title}>{ticket.subject}</h2>

      <div style={styles.field}>
        <span style={styles.label}>Customer</span>
        <span>{ticket.customer_name ?? '—'}</span>
      </div>
      <div style={styles.field}>
        <span style={styles.label}>Channel</span>
        <span className="badge plain">{ticket.channel}</span>
      </div>
      <div style={styles.field}>
        <span style={styles.label}>Request type</span>
        <span>{ticket.request_type ?? '—'}</span>
      </div>
      <div style={styles.field}>
        <span style={styles.label}>Urgency</span>
        <span className={`badge ${URGENCY_VARIANTS[ticket.urgency ?? 'low'] || 'low'}`}>
          {ticket.urgency ?? '—'}
        </span>
      </div>
      <div style={styles.field}>
        <span style={styles.label}>Suggested owner</span>
        <span>{ticket.suggested_owner ?? '—'}</span>
      </div>
      <div style={styles.field}>
        <span style={styles.label}>Status</span>
        <span className="badge plain">{ticket.status}</span>
      </div>

      <div style={styles.messageBox}>
        <div style={styles.label}>Customer message</div>
        <p style={styles.message}>{ticket.message}</p>
      </div>

      {ticket.human_notes && (
        <div style={styles.messageBox}>
          <div style={styles.label}>Human notes</div>
          <p style={styles.message}>{ticket.human_notes}</p>
        </div>
      )}

      {ticket.draft_reply !== undefined && ticket.draft_reply !== null && (
        <div style={styles.replySection}>
          <div style={styles.label}>Draft reply</div>
          <textarea
            style={styles.textarea}
            rows={6}
            value={editedReply}
            onChange={(e) => setEditedReply(e.target.value)}
            disabled={isClosed || busy !== null}
          />
        </div>
      )}

      {error && (
        <div style={styles.error}>{error}</div>
      )}

      <div style={styles.actions}>
        {canClassify && (
          <button className="btn btn-primary" onClick={handleClassify} disabled={busy !== null}>
            {busy === 'classify' ? 'Classifying...' : 'Classify (AI)'}
          </button>
        )}
        {canDraft && (
          <button className="btn btn-primary" onClick={handleDraft} disabled={busy !== null}>
            {busy === 'draft' ? 'Drafting...' : 'Draft reply (AI)'}
          </button>
        )}
        {canApprove && (
          <button className="btn btn-good" onClick={handleApprove} disabled={busy !== null}>
            {busy === 'approve' ? 'Approving...' : 'Approve to send'}
          </button>
        )}
        {canMarkSent && (
          <button className="btn btn-good" onClick={handleMarkSent} disabled={busy !== null}>
            {busy === 'mark-sent' ? 'Marking...' : 'Mark as sent'}
          </button>
        )}
        {canClose && (
          <button className="btn btn-plain" onClick={handleClose} disabled={busy !== null}>
            {busy === 'close' ? 'Closing...' : 'Close'}
          </button>
        )}
        {isClosed && (
          <span style={{ color: 'var(--muted, #8b9bb5)', fontStyle: 'italic' }}>Ticket is {ticket.status}</span>
        )}
      </div>
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: 'var(--panel, #131c2f)',
    borderRadius: 8,
    border: '1px solid var(--border, #243049)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: 'var(--text, #e6ecf5)',
  },
  field: {
    display: 'flex',
    gap: 8,
    fontSize: 13,
    alignItems: 'center',
  },
  label: {
    fontWeight: 600,
    color: 'var(--muted, #8b9bb5)',
    minWidth: 130,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  messageBox: {
    background: 'var(--bg, #0b1220)',
    borderRadius: 6,
    padding: 14,
    border: '1px solid var(--border, #243049)',
  },
  message: {
    margin: '6px 0 0 0',
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    color: 'var(--text, #e6ecf5)',
  },
  replySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  textarea: {
    width: '100%',
    background: 'var(--bg, #0b1220)',
    border: '1px solid var(--border, #243049)',
    borderRadius: 6,
    color: 'var(--text, #e6ecf5)',
    padding: 10,
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  error: {
    background: 'rgba(231, 76, 60, 0.12)',
    color: '#e74c3c',
    padding: '10px 14px',
    borderRadius: 6,
    fontSize: 13,
    border: '1px solid rgba(231, 76, 60, 0.3)',
  },
  actions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 4,
    alignItems: 'center',
  },
};
