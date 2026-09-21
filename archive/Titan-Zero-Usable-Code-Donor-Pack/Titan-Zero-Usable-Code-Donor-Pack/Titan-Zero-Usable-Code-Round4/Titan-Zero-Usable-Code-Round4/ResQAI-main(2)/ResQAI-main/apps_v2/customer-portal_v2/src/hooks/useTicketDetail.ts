import { useState, useEffect } from 'react';
import { CustomerService } from '../services/customer-service';
import type { TicketDTO } from '../models/dto';

interface UseTicketDetailResult {
  data: TicketDTO | null;
  loading: boolean;
  error: string | null;
}

export function useTicketDetail(id: string): UseTicketDetailResult {
  const [data, setData] = useState<TicketDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    CustomerService.getTicket(id)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load ticket'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
}
