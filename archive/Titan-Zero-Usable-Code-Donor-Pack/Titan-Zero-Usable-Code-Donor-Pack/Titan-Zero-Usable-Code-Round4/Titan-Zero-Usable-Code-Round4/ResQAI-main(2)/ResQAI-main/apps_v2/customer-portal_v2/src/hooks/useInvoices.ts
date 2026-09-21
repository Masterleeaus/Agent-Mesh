import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { InvoiceListItemVM } from '../models/view-models';

interface UseInvoicesResult {
  data: InvoiceListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: (page?: number) => void;
}

export function useInvoices(page: number = 1): UseInvoicesResult {
  const [data, setData] = useState<InvoiceListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback((p: number = page) => {
    setLoading(true);
    setError(null);
    CustomerService.listInvoices(p)
      .then((result) => { setData(result.invoices); setTotal(result.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load invoices'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}