import { useState, useEffect, useCallback } from 'react';
import type { DashboardMetricsVM, LiveMetricVM, RegionalStatusVM } from '../models/view-models';
import { operationsService } from '../services/operations-service';

interface UseLiveMetricsResult {
  metrics: DashboardMetricsVM | null;
  liveMetrics: LiveMetricVM[];
  regionalStatus: RegionalStatusVM[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLiveMetrics(): UseLiveMetricsResult {
  const [metrics, setMetrics] = useState<DashboardMetricsVM | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetricVM[]>([]);
  const [regionalStatus, setRegionalStatus] = useState<RegionalStatusVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationsService.getDashboardMetrics();
      setMetrics(res.metrics);
      setLiveMetrics(res.liveMetrics);
      setRegionalStatus(res.regionalStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { metrics, liveMetrics, regionalStatus, loading, error, refetch: fetch };
}
