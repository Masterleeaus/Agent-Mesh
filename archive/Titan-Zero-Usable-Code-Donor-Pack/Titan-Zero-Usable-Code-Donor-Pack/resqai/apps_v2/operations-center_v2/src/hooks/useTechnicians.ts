import { useState, useEffect, useCallback } from 'react';
import type { TechnicianDTO } from '../models/dto';
import { operationsService } from '../services/operations-service';

interface UseTechniciansResult {
  technicians: TechnicianDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTechnicians(): UseTechniciansResult {
  const [technicians, setTechnicians] = useState<TechnicianDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationsService.getTechnicians();
      setTechnicians(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load technicians');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { technicians, loading, error, refetch: fetch };
}
