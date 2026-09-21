import { useState, useEffect, useCallback } from 'react';
import type { EscalationListItemVM } from '../models/view-models';
import type { CaseListFilters } from '../models/api-requests';
import { resolutionService } from '../services/resolution-service';

interface UseEscalationsResult {
  escalations: EscalationListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEscalations(filters?: CaseListFilters): UseEscalationsResult {
  const [escalations, setEscalations] = useState<EscalationListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resolutionService.listEscalations(filters);
      setEscalations(res.data.map(e => ({
        id: e.id,
        caseId: e.caseId,
        escalatedByName: e.escalatedByName,
        escalatedToName: e.escalatedToName,
        reason: e.reason,
        status: e.status,
        age: 0,
        isUrgent: e.status === 'pending_review',
      })));
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load escalations');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { escalations, total, loading, error, refetch: fetch };
}
