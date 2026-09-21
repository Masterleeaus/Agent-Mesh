import { useState, useEffect, useCallback } from 'react';
import type { SLAMetricsVM } from '../models/view-models';
import { ticketService } from '../services/ticket-service';

interface UseSLAMetricsResult {
  metrics: SLAMetricsVM | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSLAMetrics(): UseSLAMetricsResult {
  const [metrics, setMetrics] = useState<SLAMetricsVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ticketService.getSLAMetrics();
      setMetrics({
        compliancePercent: res.compliancePercent,
        breached: res.breached,
        total: res.total,
        avgResponseTimeByChannel: res.avgResponseTimeByChannel,
        byAgent: res.byAgent,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SLA metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { metrics, loading, error, refetch: fetch };
}
