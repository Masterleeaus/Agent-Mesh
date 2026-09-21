import { useState, useCallback } from 'react';
import type { SearchRequest } from '../models/api-requests';
import type { CaseListItemVM } from '../models/view-models';
import { resolutionService } from '../services/resolution-service';

interface UseSearchResult {
  results: { cases: CaseListItemVM[]; disputes: CaseListItemVM[]; knowledge: CaseListItemVM[]; total: number };
  loading: boolean;
  error: string | null;
  search: (req: SearchRequest) => void;
}

export function useSearch(): UseSearchResult {
  const [results, setResults] = useState<{ cases: CaseListItemVM[]; disputes: CaseListItemVM[]; knowledge: CaseListItemVM[]; total: number }>({ cases: [], disputes: [], knowledge: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (req: SearchRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await resolutionService.search(req);
      setResults({
        cases: res.cases.map(c => ({ id: c.id, type: c.type, status: c.status, priority: c.priority, customerName: c.customerName, summary: c.summary, age: 0, isUrgent: c.priority === 'high' || c.priority === 'critical', hasEvidence: false, isEscalated: c.status === 'escalated', technicianName: c.technicianName })),
        disputes: res.disputes.map(d => ({ id: d.id, type: 'dispute' as const, status: d.status as CaseListItemVM['status'], priority: d.priority, customerName: d.customerName, summary: d.description, age: 0, isUrgent: d.priority === 'high' || d.priority === 'critical', hasEvidence: false, isEscalated: false })),
        knowledge: res.knowledge.map(k => ({ id: k.id, type: 'dispute' as const, status: 'closed' as const, priority: 'normal' as const, customerName: k.authorName, summary: k.title, age: 0, isUrgent: false, hasEvidence: false, isEscalated: false })),
        total: res.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}
