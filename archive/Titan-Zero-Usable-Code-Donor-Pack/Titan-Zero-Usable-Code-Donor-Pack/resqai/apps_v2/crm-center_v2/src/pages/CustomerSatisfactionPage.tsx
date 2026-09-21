import { useSatisfaction } from '../hooks/useFeedback';
import { Card, StatusBadge, Skeleton, EmptyState, ErrorState } from '../../../../shared/src/components';
import type { SatisfactionDTO } from '../models/dto';

function scoreColor(score: number): string {
  if (score >= 4) return '#16a34a';
  if (score >= 3) return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(score: number): string {
  if (score >= 4) return 'Satisfied';
  if (score >= 3) return 'Neutral';
  return 'Dissatisfied';
}

export default function CustomerSatisfactionPage() {
  const { data, loading, error, refetch } = useSatisfaction();

  if (loading) {
    return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={40} width={300} /><div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>{[1, 2, 3].map(i => <Skeleton key={i} variant="card" height={160} />)}</div></div>;
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load satisfaction data" /></div>;
  }

  const avgScore = data.length ? Math.round(data.reduce((s: number, r: SatisfactionDTO) => s + r.overallScore, 0) / data.length * 10) / 10 : 0;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Customer Satisfaction</h1>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#8b9bb5' }}>Avg Score: <span style={{ fontSize: 24, fontWeight: 700, color: scoreColor(avgScore) }}>{avgScore}</span>/5</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {data.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}><EmptyState title="No satisfaction data" description="No customer satisfaction surveys have been completed yet." /></div>
        ) : data.map((s: SatisfactionDTO) => (
          <Card key={s.id} style={{ background: '#131c2f', border: '1px solid #243049' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>{s.customerName}</div>
                <div style={{ fontSize: 11, color: '#8b9bb5', marginTop: 2 }}>{new Date(s.respondedAt).toLocaleDateString()} · {s.surveySource}</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor(s.overallScore) }}>{s.overallScore}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              {s.serviceScore != null && <div><span style={{ color: '#8b9bb5' }}>Service</span><br /><span style={{ color: scoreColor(s.serviceScore), fontWeight: 600 }}>{'★'.repeat(s.serviceScore)}{'☆'.repeat(5 - s.serviceScore)}</span></div>}
              {s.responseTimeScore != null && <div><span style={{ color: '#8b9bb5' }}>Response Time</span><br /><span style={{ color: scoreColor(s.responseTimeScore), fontWeight: 600 }}>{'★'.repeat(s.responseTimeScore)}{'☆'.repeat(5 - s.responseTimeScore)}</span></div>}
              {s.resolutionScore != null && <div><span style={{ color: '#8b9bb5' }}>Resolution</span><br /><span style={{ color: scoreColor(s.resolutionScore), fontWeight: 600 }}>{'★'.repeat(s.resolutionScore)}{'☆'.repeat(5 - s.resolutionScore)}</span></div>}
            </div>
            <div style={{ marginTop: 8 }}>
              <StatusBadge variant={s.overallScore >= 4 ? 'success' : s.overallScore >= 3 ? 'warning' : 'error'} size="sm">{scoreLabel(s.overallScore)}</StatusBadge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
