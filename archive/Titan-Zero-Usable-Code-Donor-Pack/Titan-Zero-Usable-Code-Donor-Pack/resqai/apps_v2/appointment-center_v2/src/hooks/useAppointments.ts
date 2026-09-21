import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '../services';
import type { AppointmentDTO } from '../models/dto';

export function useAppointments(filters?: any) {
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.list(filters);
      setAppointments(res.appointments);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { appointments, total, loading, error, refetch: fetch };
}
