import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '../services';
import type { TimeSlotDTO } from '../models/dto';

export function useAvailableSlots(date: string | undefined, serviceTypeId: string | undefined) {
  const [slots, setSlots] = useState<TimeSlotDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!date || !serviceTypeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.getAvailableSlots(date, serviceTypeId);
      setSlots(res.slots);
    } catch (err: any) {
      setError(err.message || 'Failed to load available slots');
    } finally {
      setLoading(false);
    }
  }, [date, serviceTypeId]);

  useEffect(() => { if (date && serviceTypeId) fetch(); }, [fetch]);

  return { slots, loading, error, refetch: fetch };
}
