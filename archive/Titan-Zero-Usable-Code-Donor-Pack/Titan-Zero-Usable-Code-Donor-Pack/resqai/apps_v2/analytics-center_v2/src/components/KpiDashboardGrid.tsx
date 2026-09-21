import type { KpiCardVM } from '../models/view-models';
import { MetricCard } from './MetricCard';
import { Skeleton, ErrorState } from '../../../../shared/src/components';

interface KpiDashboardGridProps {
  metrics: KpiCardVM[];
  loading?: boolean;
  error?: string | null;
  onMetricClick?: (id: string) => void;
  columns?: number;
}

export function KpiDashboardGrid({ metrics, loading, error, onMetricClick, columns = 4 }: KpiDashboardGridProps) {
  if (error) {
    return <ErrorState title="Failed to load KPIs" message={error} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 16 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <MetricCard key={i} metric={{ id: '', label: '', value: '', trend: { value: 0, previousValue: 0, percentChange: 0, direction: 'flat' } }} loading />
        ))}
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
        <Skeleton variant="card" width="100%" height={120} />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 16 }}>
      {metrics.map((m) => (
        <MetricCard
          key={m.id}
          metric={m}
          onClick={onMetricClick ? () => onMetricClick(m.id) : undefined}
        />
      ))}
    </div>
  );
}
