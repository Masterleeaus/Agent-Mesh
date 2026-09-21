import { useState, useEffect } from 'react';
import { CustomerService } from '../services/customer-service';
import type { AppointmentDTO } from '../models/dto';

interface UseAppointmentDetailResult {
  data: AppointmentDTO | null;
  loading: boolean;
  error: string | null;
}

export function useAppointmentDetail(id: string): UseAppointmentDetailResult {
  const [data, setData] = useState<AppointmentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    CustomerService.getAppointment(id)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load appointment'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
}
