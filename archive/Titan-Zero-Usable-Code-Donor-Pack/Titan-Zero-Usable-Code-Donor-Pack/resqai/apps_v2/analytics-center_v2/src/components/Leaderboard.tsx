import { Card } from '../../../../shared/src/components';
import type { LeaderboardEntryVM } from '../models/view-models';

interface LeaderboardProps {
  entries: LeaderboardEntryVM[];
  title?: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  maxEntries?: number;
}

const rankColors = ['#fbbf24', '#94a3b8', '#d97706'];

export function Leaderboard({ entries, title, loading, error, emptyMessage, maxEntries = 10 }: LeaderboardProps) {
  if (error) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', padding: 16 }}>{error}</div>
      </Card>
    );
  }
  if (loading) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        {title && <div style={{ width: '40%', height: 14, background: '#243049', borderRadius: 4, marginBottom: 12 }} />}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', alignItems: 'center' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#243049' }} />
            <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
            <div style={{ width: 40, height: 12, background: '#243049', borderRadius: 4 }} />
          </div>
        ))}
      </Card>
    );
  }

  const displayEntries = entries.slice(0, maxEntries);

  if (displayEntries.length === 0) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ color: '#6b7a95', fontSize: 13, textAlign: 'center', padding: 32 }}>{emptyMessage || 'No leaderboard data'}</div>
      </Card>
    );
  }

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>{title}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {displayEntries.map((entry) => {
          const changeColor = entry.trend === 'up' ? '#22c55e' : entry.trend === 'down' ? '#ef4444' : '#8b9bb5';
          const changeArrow = entry.trend === 'up' ? '\u2191' : entry.trend === 'down' ? '\u2193' : '\u2192';
          return (
            <div key={entry.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: entry.rank <= 3 ? '#1a2540' : 'transparent', borderRadius: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: entry.rank <= 3 ? rankColors[entry.rank - 1] : '#243049', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: entry.rank <= 3 ? '#0b1220' : '#8b9bb5' }}>
                {entry.rank}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: '#e6ecf5', fontWeight: 500 }}>{entry.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#e6ecf5' }}>{entry.value}</span>
                <span style={{ fontSize: 12, color: changeColor }}>{changeArrow}{Math.abs(entry.change)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
