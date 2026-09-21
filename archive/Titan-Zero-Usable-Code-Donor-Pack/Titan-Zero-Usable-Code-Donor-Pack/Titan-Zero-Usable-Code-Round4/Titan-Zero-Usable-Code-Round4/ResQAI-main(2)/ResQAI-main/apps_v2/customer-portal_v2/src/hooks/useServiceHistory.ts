import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { ServiceHistoryListItemVM } from '../models/view-models';

interface UseServiceHistoryResult {
  data: ServiceHistoryListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: (page?: number) => void;
}

export function useServiceHistory(page: number = 1): UseServiceHistoryResult {
  const [data, setData] = useState<ServiceHistoryListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback((p: number = page) => {
    setLoading(true);
    setError(null);
    CustomerService.getServiceHistory(p)
      .then((result) => { setData(result.services); setTotal(result.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load service history'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}