import { useState, useEffect, useCallback } from 'react';
import type { SupportMetricsDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

interface UseSupportMetricsResult {
  data: SupportMetricsDTO | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSupportMetrics(): UseSupportMetricsResult {
  const [data, setData] = useState<SupportMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getSupportMetrics();
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load support metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
