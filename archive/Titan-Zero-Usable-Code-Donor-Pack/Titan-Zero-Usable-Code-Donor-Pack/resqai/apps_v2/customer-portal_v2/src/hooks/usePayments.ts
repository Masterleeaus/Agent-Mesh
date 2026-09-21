import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { PaymentListItemVM } from '../models/view-models';

interface UsePaymentsResult {
  data: PaymentListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: (page?: number) => void;
}

export function usePayments(page: number = 1): UsePaymentsResult {
  const [data, setData] = useState<PaymentListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback((p: number = page) => {
    setLoading(true);
    setError(null);
    CustomerService.listPayments(p)
      .then((result) => { setData(result.payments); setTotal(result.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load payments'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}