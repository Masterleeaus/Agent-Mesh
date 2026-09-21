import { useState, type FC, memo } from 'react';
import type { AppointmentwithDetails, Technician, AISuggestion } from '../types';
import { formatServiceType, STATUS_VARIANTS, STATUS_COLOR_MAP } from '../../../../packages/config/constants';
import TechnicianPicker from './TechnicianPicker';

interface AppointmentDetailProps {
  appointment: AppointmentwithDetails;
  technicians: Technician[];
  suggestion: AISuggestion | null;
  suggesting: boolean;
  onAssignTech: (techId: string, techName: string) => void;
  onSuggestTech: () => void;
  onUpdateStatus: (status: string) => void;
  onClearSuggestion: () => void;
}

const statusActions: { label: string; targetStatus: string; showFor: string[] }[] = [
  { label: 'Start visit', targetStatus: 'in_progress', showFor: ['scheduled'] },
  { label: 'Mark complete', targetStatus: 'completed', showFor: ['in_progress'] },
  { label: 'Needs follow-up', targetStatus: 'needs_followup', showFor: ['scheduled', 'in_progress', 'completed'] },
  { label: 'Cancel', targetStatus: 'cancelled', showFor: ['scheduled', 'in_progress'] },
];

const AppointmentDetail: FC<AppointmentDetailProps> = ({
  appointment,
  technicians,
  suggestion,
  suggesting,
  onAssignTech,
  onSuggestTech,
  onUpdateStatus,
  onClearSuggestion,
}) => {
  const [selectedTechId, setSelectedTechId] = useState<string | null>(
    appointment.technician_id || null
  );

  const variant = STATUS_VARIANTS[appointment.status] || 'plain';

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        padding: 24,
        position: 'sticky',
        top: 24,
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          margin: '0 0 4px 0',
          color: 'var(--text-primary)',
        }}
      >
        {formatServiceType(appointment.service_type)}
      </h2>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginBottom: 16,
        }}
      >
        {new Date(appointment.date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 4,
          }}
        >
          Customer
        </div>
        <div style={{ color: 'var(--text-primary)', fontSize: 14 }}>
          {appointment.customer_name || '\u2014'}
        </div>
        {appointment.customer_phone && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {appointment.customer_phone}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 4,
          }}
        >
          Status
        </div>
        <span
          style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            background: `${STATUS_COLOR_MAP[variant]}20`,
            color: STATUS_COLOR_MAP[variant],
          }}
        >
          {appointment.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 4,
          }}
        >
          Technician
        </div>
        <div style={{ color: 'var(--text-primary)', fontSize: 14 }}>
          {appointment.technician_name || 'Not assigned'}
        </div>
      </div>

      {appointment.notes && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 4,
            }}
          >
            Notes
          </div>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 13,
              whiteSpace: 'pre-wrap',
            }}
          >
            {appointment.notes}
          </div>
        </div>
      )}

      <hr
        style={{
          border: 'none',
          borderTop: '1px solid var(--border)',
          margin: '20px 0',
        }}
      />

      <div style={{ marginBottom: 16 }}>
        <TechnicianPicker
          technicians={technicians}
          selectedId={selectedTechId}
          onSelect={(t) => setSelectedTechId(t.id)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={onSuggestTech}
          disabled={suggesting}
          style={{
            flex: 1,
            padding: '8px 16px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--accent)',
            background: 'transparent',
            color: 'var(--accent)',
            cursor: suggesting ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            opacity: suggesting ? 0.5 : 1,
          }}
        >
          {suggesting ? 'Suggesting\u2026' : 'Suggest tech (AI)'}
        </button>
        <button
          onClick={() => {
            if (selectedTechId) {
              const tech = technicians.find((t) => t.id === selectedTechId);
              if (tech) onAssignTech(selectedTechId, tech.name);
            }
          }}
          disabled={!selectedTechId}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius)',
            border: 'none',
            background: 'var(--accent)',
            color: '#000',
            cursor: selectedTechId ? 'pointer' : 'not-allowed',
            fontSize: 13,
            fontWeight: 600,
            opacity: selectedTechId ? 1 : 0.4,
          }}
        >
          Assign
        </button>
      </div>

      {suggestion && (
        <div
          style={{
            background: 'rgba(79,195,247,0.08)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)',
            padding: 12,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: 'var(--accent)',
              marginBottom: 4,
            }}
          >
            AI suggestion: {suggestion.pick_tech_name}
          </div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
            Score: {suggestion.score}/100
          </div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
            {suggestion.rationale}
          </div>
          {suggestion.alternatives.length > 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Alternatives: {suggestion.alternatives.join(', ')}
            </div>
          )}
          <button
            onClick={onClearSuggestion}
            style={{
              marginTop: 8,
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <hr
        style={{
          border: 'none',
          borderTop: '1px solid var(--border)',
          margin: '20px 0',
        }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {statusActions
          .filter((a) => a.showFor.includes(appointment.status))
          .map((action) => (
            <button
              key={action.targetStatus}
              onClick={() => onUpdateStatus(action.targetStatus)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {action.label}
            </button>
          ))}
      </div>
    </div>
  );
};

export default memo(AppointmentDetail);
