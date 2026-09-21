import { useState, useEffect, useCallback } from 'react';
import type { TechnicianPerformanceDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

export function useTechnicianPerformance() {
  const [data, setData] = useState<TechnicianPerformanceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await analyticsService.getTechnicianPerformance(); setData(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load technician performance'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
