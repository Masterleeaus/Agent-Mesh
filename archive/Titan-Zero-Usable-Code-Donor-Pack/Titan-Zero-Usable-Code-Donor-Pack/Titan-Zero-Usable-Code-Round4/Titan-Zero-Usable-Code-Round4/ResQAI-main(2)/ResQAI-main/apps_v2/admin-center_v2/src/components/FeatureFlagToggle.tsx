import { type FC } from 'react';
import type { FeatureFlagDTO } from '../models';

const toggleRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #243049' };
const labelStyle: React.CSSProperties = { color: '#e6ecf5', fontSize: 14, fontWeight: 500 };
const descStyle: React.CSSProperties = { color: '#8b9bb5', fontSize: 12, marginTop: 2 };
const toggleTrack: React.CSSProperties = { width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' };
const toggleThumb: React.CSSProperties = { width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' };

export const FeatureFlagToggle: FC<{ flag: FeatureFlagDTO; onToggle: (key: string, enabled: boolean) => void }> = ({ flag, onToggle }) => (
  <div style={toggleRow}>
    <div>
      <div style={labelStyle}>{flag.label}</div>
      <div style={descStyle}>{flag.description}</div>
    </div>
    <div onClick={() => onToggle(flag.key, !flag.enabled)} style={{ ...toggleTrack, background: flag.enabled ? '#41d1c4' : '#3a4a62' }}>
      <div style={{ ...toggleThumb, left: flag.enabled ? 22 : 2 }} />
    </div>
  </div>
);
