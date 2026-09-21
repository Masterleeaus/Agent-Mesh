import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '../services';
import type { TechnicianScheduleResponse } from '../models/api-responses';

export function useTechnicianSchedule(technicianId: string | undefined, date: string | undefined) {
  const [schedule, setSchedule] = useState<TechnicianScheduleResponse | null>(null);
  const [loading, setLoading] = useState(!!technicianId && !!date);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!technicianId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.getTechnicianSchedule(technicianId, date);
      setSchedule(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [technicianId, date]);

  useEffect(() => { fetch(); }, [fetch]);

  return { schedule, loading, error, refetch: fetch };
}
