import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { AppointmentDTO } from '../models/dto';

interface UseCustomerAppointmentsResult {
  data: AppointmentDTO[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: (page?: number) => void;
}

export function useCustomerAppointments(page: number = 1): UseCustomerAppointmentsResult {
  const [data, setData] = useState<AppointmentDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback((p: number = page) => {
    setLoading(true);
    setError(null);
    CustomerService.listAppointments(p)
      .then((result) => { setData(result.appointments); setTotal(result.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load appointments'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}
