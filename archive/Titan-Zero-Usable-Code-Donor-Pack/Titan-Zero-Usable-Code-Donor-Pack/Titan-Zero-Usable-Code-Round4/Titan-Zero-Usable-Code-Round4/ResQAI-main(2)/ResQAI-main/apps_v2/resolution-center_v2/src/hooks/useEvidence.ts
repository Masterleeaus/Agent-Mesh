import { useState, useEffect, useCallback } from 'react';
import type { EvidenceListItemVM } from '../models/view-models';
import { resolutionService } from '../services/resolution-service';

interface UseEvidenceResult {
  evidence: EvidenceListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEvidence(caseId: string): UseEvidenceResult {
  const [evidence, setEvidence] = useState<EvidenceListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resolutionService.listEvidence(caseId);
      setEvidence(res.data.map(e => ({
        id: e.id,
        caseId: e.caseId,
        type: e.type,
        title: e.title,
        uploadedByName: e.uploadedByName,
        createdAt: e.createdAt,
      })));
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { evidence, total, loading, error, refetch: fetch };
}
