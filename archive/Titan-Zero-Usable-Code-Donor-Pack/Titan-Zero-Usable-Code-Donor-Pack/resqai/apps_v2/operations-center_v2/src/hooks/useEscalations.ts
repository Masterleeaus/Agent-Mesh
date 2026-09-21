import { useState, useEffect, useCallback } from 'react';
import type { EscalationDTO } from '../models/dto';
import { operationsService } from '../services/operations-service';

interface UseEscalationsResult {
  escalations: EscalationDTO[];
  total: number;
  openCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEscalations(): UseEscalationsResult {
  const [escalations, setEscalations] = useState<EscalationDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationsService.getEscalations();
      setEscalations(res.data);
      setTotal(res.total);
      setOpenCount(res.openCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load escalations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { escalations, total, openCount, loading, error, refetch: fetch };
}
