import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '../services';
import type { DashboardStatsResponse } from '../models/api-responses';

export function useAppointmentStats() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.getDashboardStats();
      setStats(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, loading, error, refetch: fetch };
}
