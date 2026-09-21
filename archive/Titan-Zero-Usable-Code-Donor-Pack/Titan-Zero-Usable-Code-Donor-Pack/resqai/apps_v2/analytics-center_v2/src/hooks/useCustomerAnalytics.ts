import { useState, useEffect, useCallback } from 'react';
import type { CustomerMetricsDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

export function useCustomerAnalytics() {
  const [data, setData] = useState<CustomerMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await analyticsService.getCustomerMetrics(); setData(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load customer analytics'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
