import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '../services';
import type { ServiceTypeDTO } from '../models/dto';

export function useServiceTypes() {
  const [services, setServices] = useState<ServiceTypeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.listServiceTypes();
      setServices(res.services);
    } catch (err: any) {
      setError(err.message || 'Failed to load service types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { services, loading, error, refetch: fetch };
}
