import { memo, type FC } from 'react';
import type { Technician } from '../types';

interface TechnicianPickerProps {
  technicians: Technician[];
  selectedId: string | null;
  onSelect: (tech: Technician) => void;
}

const TechnicianPicker: FC<TechnicianPickerProps> = ({
  technicians,
  selectedId,
  onSelect,
}) => {
  const active = technicians.filter((t) => t.status === 'active');

  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: 8,
        }}
      >
        Select technician
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {active.length === 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            No active technicians
          </span>
        )}
        {active.map((t) => {
          const selected = t.id === selectedId;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                padding: '8px 12px',
                borderRadius: 'var(--radius)',
                border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                background: selected
                  ? 'rgba(79,195,247,0.1)'
                  : 'var(--bg-card)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 13,
                textAlign: 'left',
                transition: 'border-color 0.15s',
              }}
            >
              <span style={{ fontWeight: 600 }}>{t.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {t.skill} &middot; {t.availability || 'unknown'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(TechnicianPicker);
