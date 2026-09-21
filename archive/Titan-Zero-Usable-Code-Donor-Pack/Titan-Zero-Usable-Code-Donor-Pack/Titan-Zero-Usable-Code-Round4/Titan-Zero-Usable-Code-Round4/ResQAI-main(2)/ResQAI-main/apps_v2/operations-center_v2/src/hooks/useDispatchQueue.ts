import { useState, useEffect, useCallback } from 'react';
import type { OperationDTO } from '../models/dto';
import { operationsService } from '../services/operations-service';

interface UseDispatchQueueResult {
  pendingOperations: OperationDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDispatchQueue(): UseDispatchQueueResult {
  const [pendingOperations, setPendingOperations] = useState<OperationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationsService.list({ status: ['pending_dispatch', 'dispatched'] });
      setPendingOperations(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dispatch queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { pendingOperations, loading, error, refetch: fetch };
}
