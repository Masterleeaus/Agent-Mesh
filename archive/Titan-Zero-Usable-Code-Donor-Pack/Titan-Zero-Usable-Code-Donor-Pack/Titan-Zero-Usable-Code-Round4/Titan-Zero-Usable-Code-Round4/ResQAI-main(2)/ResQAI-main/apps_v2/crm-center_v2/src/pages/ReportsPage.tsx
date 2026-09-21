import { useState } from 'react';
import { useReports } from '../hooks/useReports';
import { Card, StatusBadge, Button, Skeleton, EmptyState, ErrorState, Filter } from '../../../../shared/src/components';

const typeColors: Record<string, string> = {
  health: '#16a34a', compliance: '#3b82f6', satisfaction: '#f59e0b',
  pipeline: '#8b5cf6', retention: '#ef4444', feedback: '#41d1c4',
};

export default function ReportsPage() {
  const { data, loading, error, refetch } = useReports();
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  if (loading) {
    return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={40} width={300} /><div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>{[1, 2, 3].map(i => <Skeleton key={i} variant="card" height={120} />)}</div></div>;
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load reports" /></div>;
  }

  let filtered = data;
  if (typeFilter.length) filtered = filtered.filter((r: { type: string }) => typeFilter.includes(r.type));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Reports</h1>
        <Button variant="primary" size="sm" onClick={() => {}}>Generate Report</Button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Filter groups={[{ id: 'type', label: 'Type', type: 'checkbox', options: [
          { label: 'Health', value: 'health' }, { label: 'Compliance', value: 'compliance' },
          { label: 'Satisfaction', value: 'satisfaction' }, { label: 'Pipeline', value: 'pipeline' },
          { label: 'Retention', value: 'retention' }, { label: 'Feedback', value: 'feedback' },
        ]}]} values={{ type: typeFilter }}
          onChange={(id: string, value: string, checked: boolean) => setTypeFilter(prev => checked ? [...prev, value] : prev.filter(v => v !== value))}
          onClear={() => setTypeFilter([])} />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No reports" description="No reports available matching your criteria." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {filtered.map((r: { id: string; name: string; type: string; generatedAt: string; period: string; status: string }) => (
            <Card key={r.id} style={{ background: '#131c2f', border: '1px solid #243049' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#8b9bb5', marginTop: 2 }}>{r.period}</div>
                </div>
                <StatusBadge variant={r.status === 'ready' ? 'success' : 'warning'} size="sm">{r.status}</StatusBadge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: typeColors[r.type] || '#6b7280' }} />
                  <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'capitalize' }}>{r.type}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#8b9bb5' }}>{new Date(r.generatedAt).toLocaleDateString()}</span>
                  <Button variant="ghost" size="sm" onClick={() => {}}>View</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
