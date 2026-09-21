import { useState, useEffect, useCallback } from 'react';
import type { KpiCardVM } from '../models/view-models';
import { KpiDashboardGrid } from './KpiDashboardGrid';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';

interface LiveKPICardsProps {
  metrics: KpiCardVM[];
  loading?: boolean;
  error?: string | null;
  onMetricClick?: (id: string) => void;
  columns?: number;
  refreshInterval?: number;
  onRefresh?: () => void;
  lastUpdated?: string | null;
}

export function LiveKPICards({ metrics, loading, error, onMetricClick, columns = 4, refreshInterval = 60000, onRefresh, lastUpdated }: LiveKPICardsProps) {
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(refreshInterval);

  const tick = useCallback(() => {
    setTimeUntilRefresh((prev) => {
      if (prev <= 1000) {
        onRefresh?.();
        return refreshInterval;
      }
      return prev - 1000;
    });
  }, [refreshInterval, onRefresh]);

  useEffect(() => {
    if (!refreshInterval || !onRefresh) return;
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [tick, refreshInterval, onRefresh]);

  const progress = (timeUntilRefresh / refreshInterval) * 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: loading ? '#fbbf24' : '#22c55e', animation: loading ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#8b9bb5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {loading ? 'Refreshing...' : 'Live Dashboard'}
          </span>
        </div>
        <DataFreshnessIndicator lastUpdated={lastUpdated || null} loading={loading} />
      </div>
      {refreshInterval && onRefresh && (
        <div style={{ height: 2, background: '#1a2540', borderRadius: 1, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#41d1c4', borderRadius: 1, transition: 'width 1s linear' }} />
        </div>
      )}
      <KpiDashboardGrid metrics={metrics} loading={loading} error={error} onMetricClick={onMetricClick} columns={columns} />
    </div>
  );
}
