import { useState, useEffect, useCallback } from 'react';
import type { AppointmentMetricsDTO } from '../models/dto';
import { analyticsService } from '../services/analytics-service';

export function useAppointmentMetrics() {
  const [data, setData] = useState<AppointmentMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await analyticsService.getAppointmentMetrics(); setData(res.data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
