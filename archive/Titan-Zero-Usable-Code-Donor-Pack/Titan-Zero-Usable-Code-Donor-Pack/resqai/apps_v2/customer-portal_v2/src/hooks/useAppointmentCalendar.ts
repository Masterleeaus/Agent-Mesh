import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { AppointmentListItemVM } from '../models/view-models';

interface CalendarDay {
  date: string;
  appointments: AppointmentListItemVM[];
}

interface UseAppointmentCalendarResult {
  days: CalendarDay[];
  loading: boolean;
  error: string | null;
  navigateMonth: (delta: number) => void;
  year: number;
  month: number;
}

export function useAppointmentCalendar(initialYear?: number, initialMonth?: number): UseAppointmentCalendarResult {
  const now = new Date();
  const [year, setYear] = useState(initialYear ?? now.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? now.getMonth());
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback((y: number, m: number) => {
    setLoading(true);
    setError(null);
    CustomerService.getAppointmentCalendarAppointments(y, m)
      .then((result) => {
        const calDays: CalendarDay[] = result.map((r) => ({
          date: r.date,
          appointments: r.appointments,
        }));
        setDays(calDays);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load calendar'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(year, month); }, [fetch, year, month]);

  const navigateMonth = useCallback((delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
  }, [month, year]);

  return { days, loading, error, navigateMonth, year, month };
}