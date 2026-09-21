import { useState, useEffect, useCallback } from 'react';
import type { CaseListItemVM } from '../models/view-models';
import type { CaseListFilters } from '../models/api-requests';
import { resolutionService } from '../services/resolution-service';

interface UseCasesResult {
  cases: CaseListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCases(filters?: CaseListFilters): UseCasesResult {
  const [cases, setCases] = useState<CaseListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resolutionService.listCases(filters);
      setCases(res.data.map(c => ({
        id: c.id,
        type: c.type,
        status: c.status,
        priority: c.priority,
        customerName: c.customerName,
        technicianName: c.technicianName,
        summary: c.summary,
        age: 0,
        isUrgent: c.priority === 'high' || c.priority === 'critical',
        hasEvidence: false,
        isEscalated: c.status === 'escalated',
      })));
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { cases, total, loading, error, refetch: fetch };
}
