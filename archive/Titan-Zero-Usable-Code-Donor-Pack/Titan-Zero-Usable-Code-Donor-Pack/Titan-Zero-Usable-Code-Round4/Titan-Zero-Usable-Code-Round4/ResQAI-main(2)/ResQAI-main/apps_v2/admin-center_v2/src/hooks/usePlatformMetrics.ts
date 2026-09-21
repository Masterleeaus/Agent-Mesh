import { useState, useEffect } from 'react';
import type { PlatformMetricDTO } from '../models';
import { getPlatformMetrics } from '../services/admin-service';

interface UsePlatformMetricsResult { data: PlatformMetricDTO[]; loading: boolean; error: string | null; }

export function usePlatformMetrics(): UsePlatformMetricsResult {
  const [data, setData] = useState<PlatformMetricDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    getPlatformMetrics().then(res => { if (!cancelled) { setData(res.data); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
