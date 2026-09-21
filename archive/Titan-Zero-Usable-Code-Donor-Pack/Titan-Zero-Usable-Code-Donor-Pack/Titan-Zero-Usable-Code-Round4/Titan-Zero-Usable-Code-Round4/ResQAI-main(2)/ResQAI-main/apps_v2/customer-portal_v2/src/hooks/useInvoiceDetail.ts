import { useState, useEffect } from 'react';
import { CustomerService } from '../services/customer-service';
import type { InvoiceDTO } from '../models/dto';

interface UseInvoiceDetailResult {
  data: InvoiceDTO | null;
  loading: boolean;
  error: string | null;
}

export function useInvoiceDetail(id: string): UseInvoiceDetailResult {
  const [data, setData] = useState<InvoiceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    CustomerService.getInvoice(id)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load invoice'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
}