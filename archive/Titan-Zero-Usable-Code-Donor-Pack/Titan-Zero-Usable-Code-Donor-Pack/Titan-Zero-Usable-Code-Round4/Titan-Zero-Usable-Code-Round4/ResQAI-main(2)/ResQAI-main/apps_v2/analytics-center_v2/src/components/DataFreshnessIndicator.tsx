interface DataFreshnessIndicatorProps {
  lastUpdated: string | null;
  loading?: boolean;
}

export function DataFreshnessIndicator({ lastUpdated, loading }: DataFreshnessIndicatorProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1.5s infinite' }} />
        <span style={{ fontSize: 11, color: '#8b9bb5' }}>Refreshing...</span>
      </div>
    );
  }

  if (!lastUpdated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6b7a95' }} />
        <span style={{ fontSize: 11, color: '#6b7a95' }}>No data</span>
      </div>
    );
  }

  const updated = new Date(lastUpdated);
  const now = new Date();
  const diffMs = now.getTime() - updated.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const freshness = diffMin < 5 ? '#22c55e' : diffMin < 30 ? '#fbbf24' : '#ef4444';
  const label = diffMin < 1 ? 'Just now' : diffMin < 60 ? `${diffMin}m ago` : `${Math.floor(diffMin / 60)}h ago`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: freshness }} />
      <span style={{ fontSize: 11, color: '#8b9bb5' }}>Updated {label}</span>
    </div>
  );
}
