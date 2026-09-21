import { useState, useEffect, useCallback } from 'react';
import type { DisputeListItemVM } from '../models/view-models';
import type { DisputeListFilters } from '../models/api-requests';
import { resolutionService } from '../services/resolution-service';

interface UseDisputesResult {
  disputes: DisputeListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDisputes(filters?: DisputeListFilters): UseDisputesResult {
  const [disputes, setDisputes] = useState<DisputeListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resolutionService.listDisputes(filters);
      setDisputes(res.data.map(d => ({
        id: d.id,
        caseId: d.caseId,
        reason: d.reason,
        customerName: d.customerName,
        priority: d.priority,
        status: d.status,
        amount: d.amount,
        age: 0,
        isUrgent: d.priority === 'high' || d.priority === 'critical',
      })));
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { disputes, total, loading, error, refetch: fetch };
}
