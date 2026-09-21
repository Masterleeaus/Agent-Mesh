import { useState, useEffect } from 'react';
import { CustomerService } from '../services/customer-service';
import type { DisputeDTO } from '../models/dto';

interface UseDisputeDetailResult {
  data: DisputeDTO | null;
  loading: boolean;
  error: string | null;
}

export function useDisputeDetail(id: string): UseDisputeDetailResult {
  const [data, setData] = useState<DisputeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    CustomerService.getDispute(id)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dispute'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
}
