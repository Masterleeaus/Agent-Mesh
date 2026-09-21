import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '../services';
import type { AppointmentHistoryResponse } from '../models/api-responses';

export function useAppointmentHistory(appointmentId?: string) {
  const [history, setHistory] = useState<AppointmentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(!!appointmentId);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.getHistory(appointmentId);
      setHistory(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => { if (appointmentId) fetch(); }, [fetch]);

  return { history, loading, error, refetch: fetch };
}

export function useAllHistory(filters?: { dateFrom?: string; dateTo?: string; eventType?: string }) {
  const [history, setHistory] = useState<AppointmentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.getAllHistory(filters);
      setHistory(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { history, loading, error, refetch: fetch };
}
