import { useState, useEffect, useCallback } from 'react';
import type { CaseDetailVM } from '../models/view-models';
import { resolutionService } from '../services/resolution-service';

interface UseCaseDetailResult {
  detail: CaseDetailVM | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCaseDetail(caseId: string): UseCaseDetailResult {
  const [detail, setDetail] = useState<CaseDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resolutionService.getCaseById(caseId);
      const vid: CaseDetailVM = {
        case: res.case,
        dispute: res.dispute,
        resolution: res.resolution,
        evidence: res.evidence,
        escalations: res.escalations,
        approvals: res.approvals,
        technicianReport: res.technicianReport,
        customerComplaint: res.customerComplaint,
        timeline: res.timeline,
      };
      setDetail(vid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { detail, loading, error, refetch: fetch };
}
