import { useState, useEffect, useCallback } from 'react';
import type { ResolutionListItemVM } from '../models/view-models';
import type { CaseListFilters } from '../models/api-requests';
import { resolutionService } from '../services/resolution-service';

interface UseResolutionsResult {
  resolutions: ResolutionListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useResolutions(filters?: CaseListFilters): UseResolutionsResult {
  const [resolutions, setResolutions] = useState<ResolutionListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resolutionService.listResolutions(filters);
      setResolutions(res.data.map(r => ({
        id: r.id,
        caseId: r.caseId,
        type: r.type,
        customerName: '',
        createdByName: r.createdByName,
        assignedToName: r.assignedToName,
        status: r.status,
        age: 0,
        isUrgent: false,
      })));
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resolutions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { resolutions, total, loading, error, refetch: fetch };
}
