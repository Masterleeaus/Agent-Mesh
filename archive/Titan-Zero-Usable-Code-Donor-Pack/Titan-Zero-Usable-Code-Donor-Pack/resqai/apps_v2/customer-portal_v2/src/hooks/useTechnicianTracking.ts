import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { TechnicianTrackingVM } from '../models/view-models';

interface UseTechnicianTrackingResult {
  data: TechnicianTrackingVM | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTechnicianTracking(appointmentId: string): UseTechnicianTrackingResult {
  const [data, setData] = useState<TechnicianTrackingVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!appointmentId) { setData(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    CustomerService.getTechnicianTracking(appointmentId)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load tracking'))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useLiveTechnicianStatus(appointmentId: string) {
  const { data, loading, error, refetch } = useTechnicianTracking(appointmentId);
  useEffect(() => {
    if (!appointmentId || !data || data.status === 'completed') return;
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [appointmentId, data?.status, refetch]);
  return { data, loading, error, refetch };
}