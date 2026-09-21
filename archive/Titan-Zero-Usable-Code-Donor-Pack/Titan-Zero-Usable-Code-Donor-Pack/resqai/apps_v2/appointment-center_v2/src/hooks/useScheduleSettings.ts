import { useState, useEffect, useCallback } from 'react';

interface ScheduleSettings {
  defaultSlotDuration: number;
  defaultBufferMinutes: number;
  maxAppointmentsPerDay: number;
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
}

const defaultSettings: ScheduleSettings = {
  defaultSlotDuration: 60,
  defaultBufferMinutes: 15,
  maxAppointmentsPerDay: 8,
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  workingHoursStart: '08:00',
  workingHoursEnd: '17:00',
};

export function useScheduleSettings() {
  const [settings, setSettings] = useState<ScheduleSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 300));
      setSettings(defaultSettings);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { settings, loading, error, refetch: fetch, setSettings };
}
