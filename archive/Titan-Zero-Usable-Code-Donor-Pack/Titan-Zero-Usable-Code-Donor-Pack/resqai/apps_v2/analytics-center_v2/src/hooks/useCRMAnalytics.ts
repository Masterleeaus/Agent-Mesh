import { useState, useEffect, useCallback } from 'react';
import type { CRMMetricsDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

export function useCRMAnalytics() {
  const [data, setData] = useState<CRMMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await analyticsService.getCRMMetrics(); setData(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load CRM analytics'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
