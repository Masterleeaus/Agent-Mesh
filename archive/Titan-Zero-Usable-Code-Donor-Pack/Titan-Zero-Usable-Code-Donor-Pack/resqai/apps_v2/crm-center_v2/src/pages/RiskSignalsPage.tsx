import { useState } from 'react';
import { useRiskSignals } from '../../hooks/useRiskSignals';
import { Card, Filter, StatusBadge, Skeleton, EmptyState, ErrorState } from '../../../../shared/src/components';
import { RiskSignalCard } from '../../components';
import type { RiskLevel } from '../../models/dto';

function levelVariant(level: RiskLevel): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (level) { case 'critical': case 'high': return 'error'; case 'medium': return 'warning'; case 'low': return 'success'; default: return 'neutral'; }
}

export default function RiskSignalsPage() {
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const { data, loading, error, refetch } = useRiskSignals({ level: levelFilter.join(',') || undefined });

  if (loading && data.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton variant="rectangular" height={40} width={300} />
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="card" height={100} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load risk signals" /></div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Risk Signals</h1>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Filter
          groups={[{ id: 'level', label: 'Risk Level', type: 'checkbox', options: [
            { label: 'Critical', value: 'critical' }, { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' }, { label: 'Low', value: 'low' },
          ]}]}
          values={{ level: levelFilter }}
          onChange={(id: string, value: string, checked: boolean) => { setLevelFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value)); }}
          onClear={() => setLevelFilter([])}
        />
      </div>
      {data.length === 0 ? (
        <EmptyState title="No risk signals" description="All accounts are in good standing with no active risk signals." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map(signal => (
            <RiskSignalCard
              key={signal.id}
              type={signal.type}
              description={signal.description}
              level={signal.level}
              category={signal.category}
              acknowledged={signal.acknowledged}
              detectedAt={signal.detectedAt}
              accountName={signal.accountName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
