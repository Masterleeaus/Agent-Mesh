import { useState, useEffect } from 'react';
import { CustomerService } from '../services/customer-service';

interface UseAvailableSlotsResult {
  data: string[];
  loading: boolean;
  error: string | null;
}

export function useAvailableSlots(date: string): UseAvailableSlotsResult {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) { setData([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    CustomerService.getAvailableSlots(date)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load available slots'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date]);

  return { data, loading, error };
}
