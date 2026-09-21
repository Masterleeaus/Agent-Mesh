import { useState, useEffect, useCallback } from 'react';
import type { SLAMetricsDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

export function useSLAMetrics() {
  const [data, setData] = useState<SLAMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await analyticsService.getSLAMetrics(); setData(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load SLA metrics'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
