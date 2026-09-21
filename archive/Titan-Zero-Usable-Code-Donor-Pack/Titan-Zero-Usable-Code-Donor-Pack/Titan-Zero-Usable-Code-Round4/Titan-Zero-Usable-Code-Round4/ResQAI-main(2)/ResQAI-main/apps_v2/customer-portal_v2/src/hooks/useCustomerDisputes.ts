import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { DisputeDTO } from '../models/dto';

interface UseCustomerDisputesResult {
  data: DisputeDTO[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useCustomerDisputes(page: number = 1): UseCustomerDisputesResult {
  const [data, setData] = useState<DisputeDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback((p: number = page) => {
    setLoading(true);
    setError(null);
    CustomerService.listDisputes(p)
      .then((result) => { setData(result.disputes); setTotal(result.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load disputes'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error };
}
