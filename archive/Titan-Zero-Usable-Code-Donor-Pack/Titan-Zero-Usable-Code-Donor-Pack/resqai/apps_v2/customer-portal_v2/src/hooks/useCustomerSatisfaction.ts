import { useState, useEffect } from 'react';
import { CustomerService } from '../services/customer-service';
import type { CustomerSatisfactionVM } from '../models/view-models';

interface UseCustomerSatisfactionResult {
  data: CustomerSatisfactionVM | null;
  loading: boolean;
  error: string | null;
}

export function useCustomerSatisfaction(): UseCustomerSatisfactionResult {
  const [data, setData] = useState<CustomerSatisfactionVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    CustomerService.getCustomerSatisfaction()
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load satisfaction data'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}