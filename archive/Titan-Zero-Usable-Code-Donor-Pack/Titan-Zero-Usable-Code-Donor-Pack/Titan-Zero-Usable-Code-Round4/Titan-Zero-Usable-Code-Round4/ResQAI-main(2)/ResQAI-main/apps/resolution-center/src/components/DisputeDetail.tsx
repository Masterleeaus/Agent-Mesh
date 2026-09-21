import React, { useState, memo } from 'react';
import type { Dispute, Appointment, Customer } from '../types';
import { EvidencePanel } from './EvidencePanel';
import { RecommendationCard } from './RecommendationCard';
import {
  analyzeDispute,
  approveResolution,
  rejectDispute,
  closeDispute,
  overrideResolution,
} from '../services/dispute-service';
import { DISPUTE_STATUS_VARIANTS } from '../../../../packages/config/constants';
import { errorMessage } from '../../../../packages/utils/service-helpers';

interface DisputeDetailProps {
  dispute: Dispute;
  appointment: Appointment | null;
  customer: Customer | null;
  onUpdate: (id: string, patch: Partial<Dispute>) => void;
  onRefresh: () => Promise<void>;
}

const DISPUTE_BADGE: Record<string, string> = Object.fromEntries(
  Object.entries(DISPUTE_STATUS_VARIANTS).map(([k, v]) => [k, `badge ${v}`]),
);

export const DisputeDetail = memo(function DisputeDetail({ dispute, appointment, customer, onUpdate, onRefresh }: DisputeDetailProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideNotes, setOverrideNotes] = useState('');

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setActionLoading(action);
    setActionError(null);
    try {
      await fn();
      await onRefresh();
    } catch (err) {
      const msg = errorMessage(err);
      if (import.meta.env.DEV) {
        console.error(`${action} failed:`, msg);
      }
      setActionError(`Action failed: ${msg}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <div style={styles.customerName}>{customer?.name ?? 'Unknown customer'}</div>
          <div style={styles.meta}>
            {appointment?.service_type ?? '—'} &middot;{' '}
            {appointment?.date ? new Date(appointment.date).toLocaleDateString() : '—'}
          </div>
        </div>
        <span className={DISPUTE_BADGE[dispute.status] || 'badge plain'}>{dispute.status}</span>
      </div>

      <EvidencePanel dispute={dispute} />
      <RecommendationCard dispute={dispute} />

      <div style={styles.actions}>
        {dispute.status === 'open' && (
          <button
            className="btn btn-primary"
            style={styles.btn}
            onClick={() => handleAction('analyze', () => analyzeDispute(dispute))}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'analyze' ? 'Analyzing...' : 'Analyze (AI)'}
          </button>
        )}

        {dispute.status === 'recommendation_ready' && (
          <>
            <button
              className="btn btn-primary"
              style={styles.btn}
              onClick={() =>
                handleAction('approve', () => approveResolution(dispute, customer))
              }
              disabled={actionLoading !== null}
            >
              {actionLoading === 'approve' ? 'Approving...' : 'Approve resolution'}
            </button>
            <button
              className="btn btn-danger"
              style={styles.btn}
              onClick={() => handleAction('reject', () => rejectDispute(dispute))}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        )}

        {dispute.status !== 'closed' && dispute.status !== 'rejected' && (
          <button
            className="btn btn-secondary"
            style={styles.btn}
            onClick={() => handleAction('close', () => closeDispute(dispute))}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'close' ? 'Closing...' : 'Close dispute'}
          </button>
        )}

        <button
          className="btn btn-secondary"
          style={styles.btn}
          onClick={() => setOverrideMode(!overrideMode)}
        >
          {overrideMode ? 'Cancel override' : 'Override resolution'}
        </button>
      </div>

      {actionError && (
        <div style={styles.errorBox}>
          {actionError}
        </div>
      )}

      {overrideMode && (
        <div style={styles.overrideBox}>
          <textarea
            style={styles.textarea}
            rows={4}
            placeholder="Enter override notes explaining the resolution override..."
            value={overrideNotes}
            onChange={(e) => setOverrideNotes(e.target.value)}
          />
          <button
            className="btn btn-primary"
            style={styles.btn}
            onClick={() => {
              if (!overrideNotes.trim()) return;
              handleAction('override', () => overrideResolution(dispute, overrideNotes));
              setOverrideMode(false);
              setOverrideNotes('');
            }}
            disabled={actionLoading !== null || !overrideNotes.trim()}
          >
            {actionLoading === 'override' ? 'Submitting...' : 'Submit override'}
          </button>
        </div>
      )}
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text, #e6ecf5)',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: 'var(--muted, #8b9bb5)',
  },
  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  btn: {
    fontSize: 13,
  },
  overrideBox: {
    background: 'var(--panel, #131c2f)',
    borderRadius: 8,
    border: '1px solid var(--border, #243049)',
    padding: 16,
    marginBottom: 16,
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--bg, #0b1220)',
    color: 'var(--text, #e6ecf5)',
    border: '1px solid var(--border, #243049)',
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: 12,
    outline: 'none',
  },
  errorBox: {
    background: 'rgba(231, 76, 60, 0.12)',
    color: '#e74c3c',
    padding: '10px 14px',
    borderRadius: 6,
    fontSize: 13,
    border: '1px solid rgba(231, 76, 60, 0.3)',
    marginBottom: 12,
  },
};
