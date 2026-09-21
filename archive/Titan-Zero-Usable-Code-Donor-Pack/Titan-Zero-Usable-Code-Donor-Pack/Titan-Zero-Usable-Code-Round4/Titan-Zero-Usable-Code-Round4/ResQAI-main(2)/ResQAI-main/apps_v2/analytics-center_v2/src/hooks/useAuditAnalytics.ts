import { useState, useEffect, useCallback } from 'react';
import type { AuditMetricsDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

export function useAuditAnalytics() {
  const [data, setData] = useState<AuditMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await analyticsService.getAuditMetrics(); setData(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load audit analytics'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
