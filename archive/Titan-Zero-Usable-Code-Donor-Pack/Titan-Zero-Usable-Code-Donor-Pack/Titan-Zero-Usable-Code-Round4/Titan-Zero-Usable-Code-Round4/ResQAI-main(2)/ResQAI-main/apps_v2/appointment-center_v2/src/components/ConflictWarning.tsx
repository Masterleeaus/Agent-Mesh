import type { ConflictWarningVM } from '../models/view-models';

interface ConflictWarningProps {
  warnings: ConflictWarningVM[];
}

const typeColors: Record<string, { bg: string; border: string; icon: string }> = {
  time_overlap: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: '!' },
  technician_unavailable: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', icon: '!' },
  overtime: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', icon: '!' },
  skill_mismatch: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: '✕' },
};

const containerStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8,
};

export function ConflictWarning({ warnings }: ConflictWarningProps) {
  if (!warnings.length) return null;

  return (
    <div style={containerStyle}>
      {warnings.map((w, i) => {
        const tc = typeColors[w.type] || typeColors.time_overlap;
        return (
          <div key={i} style={{
            padding: '8px 12px', borderRadius: 6,
            background: tc.bg, border: `1px solid ${tc.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: '#e2e8f0',
          }}>
            <span style={{ color: tc.border, fontWeight: 700 }}>{tc.icon}</span>
            <span>{w.message}</span>
          </div>
        );
      })}
    </div>
  );
}
