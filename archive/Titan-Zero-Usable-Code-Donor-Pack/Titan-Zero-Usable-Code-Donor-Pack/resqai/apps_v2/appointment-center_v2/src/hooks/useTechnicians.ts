import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '../services';
import type { TechnicianDTO } from '../models/dto';

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<TechnicianDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentService.listTechnicians();
      setTechnicians(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load technicians');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { technicians, loading, error, refetch: fetch };
}
