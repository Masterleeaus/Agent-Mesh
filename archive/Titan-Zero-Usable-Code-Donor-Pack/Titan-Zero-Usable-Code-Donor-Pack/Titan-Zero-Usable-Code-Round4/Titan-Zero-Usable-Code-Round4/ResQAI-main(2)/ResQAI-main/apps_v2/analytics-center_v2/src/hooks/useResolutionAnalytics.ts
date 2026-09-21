import { useState, useEffect, useCallback } from 'react';
import type { ResolutionMetricsDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

export function useResolutionAnalytics() {
  const [data, setData] = useState<ResolutionMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await analyticsService.getResolutionMetrics(); setData(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load resolution analytics'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
