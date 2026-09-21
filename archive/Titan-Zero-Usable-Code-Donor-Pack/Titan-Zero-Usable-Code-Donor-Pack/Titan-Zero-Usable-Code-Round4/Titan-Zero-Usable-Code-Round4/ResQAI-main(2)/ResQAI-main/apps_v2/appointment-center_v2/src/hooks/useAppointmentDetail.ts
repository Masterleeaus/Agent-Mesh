import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '../services';
import type { AppointmentDTO } from '../models/dto';

export function useAppointmentDetail(id: string | undefined) {
  const [appointment, setAppointment] = useState<AppointmentDTO | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.getById(id);
      setAppointment(res.appointment);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { appointment, loading, error, refetch: fetch };
}
