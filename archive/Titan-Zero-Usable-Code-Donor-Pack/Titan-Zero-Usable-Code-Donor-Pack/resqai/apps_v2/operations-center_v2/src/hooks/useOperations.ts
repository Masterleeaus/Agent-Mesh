import { useState, useEffect, useCallback } from 'react';
import type { OperationDTO } from '../models/dto';
import type { OperationsListFilters } from '../models/api-requests';
import { operationsService } from '../services/operations-service';

interface UseOperationsResult {
  operations: OperationDTO[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOperations(filters?: OperationsListFilters): UseOperationsResult {
  const [operations, setOperations] = useState<OperationDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationsService.list(filters);
      setOperations(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operations');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { operations, total, loading, error, refetch: fetch };
}
