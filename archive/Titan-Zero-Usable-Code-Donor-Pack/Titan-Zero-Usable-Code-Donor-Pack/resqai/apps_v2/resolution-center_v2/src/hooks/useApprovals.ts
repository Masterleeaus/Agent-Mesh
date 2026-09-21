import { useState, useEffect, useCallback } from 'react';
import type { ApprovalListItemVM } from '../models/view-models';
import type { CaseListFilters } from '../models/api-requests';
import { resolutionService } from '../services/resolution-service';

interface UseApprovalsResult {
  approvals: ApprovalListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApprovals(filters?: CaseListFilters): UseApprovalsResult {
  const [approvals, setApprovals] = useState<ApprovalListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resolutionService.listApprovals(filters);
      setApprovals(res.data.map(a => ({
        id: a.id,
        caseId: a.caseId,
        type: a.type,
        requestedByName: a.requestedByName,
        status: a.status,
        age: 0,
        isUrgent: false,
      })));
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { approvals, total, loading, error, refetch: fetch };
}
