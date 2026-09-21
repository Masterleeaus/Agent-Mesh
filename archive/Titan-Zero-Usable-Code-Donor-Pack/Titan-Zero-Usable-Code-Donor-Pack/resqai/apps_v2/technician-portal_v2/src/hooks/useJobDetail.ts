import { useState, useEffect, useCallback } from 'react';
import type { JobDetailVM } from '../models/view-models';
import { technicianService } from '../services/technician-service';

interface UseJobDetailResult {
  detail: JobDetailVM | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useJobDetail(id: string): UseJobDetailResult {
  const [detail, setDetail] = useState<JobDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await technicianService.getJobById(id);
      setDetail({
        job: res.job,
        customer: res.customer,
        checklist: res.checklist,
        notes: res.notes,
        parts: res.parts,
        evidence: res.evidence,
        signature: res.signature ? { id: res.signature.id, data: res.signature.data, customerName: res.signature.customerName, signedAt: res.signature.signedAt } : undefined,
        messages: res.messages,
        timeline: res.timeline,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { detail, loading, error, refetch: fetch };
}
