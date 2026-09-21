import { useState, useEffect, useCallback } from 'react';
import type { ProductivityMetricsDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

export function useProductivityMetrics() {
  const [data, setData] = useState<ProductivityMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await analyticsService.getProductivityMetrics(); setData(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load productivity metrics'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
