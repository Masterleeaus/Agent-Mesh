import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { TicketDTO } from '../models/dto';

interface UseCustomerTicketsResult {
  data: TicketDTO[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: (page?: number) => void;
}

export function useCustomerTickets(page: number = 1): UseCustomerTicketsResult {
  const [data, setData] = useState<TicketDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback((p: number = page) => {
    setLoading(true);
    setError(null);
    CustomerService.listTickets(p)
      .then((result) => { setData(result.tickets); setTotal(result.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load tickets'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}
