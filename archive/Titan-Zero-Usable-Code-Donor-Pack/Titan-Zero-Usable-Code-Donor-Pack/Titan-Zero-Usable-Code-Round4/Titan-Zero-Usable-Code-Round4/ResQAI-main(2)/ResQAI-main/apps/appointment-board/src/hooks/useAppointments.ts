import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  Appointment,
  Customer,
  Technician,
  AppointmentwithDetails,
  AppointmentGroup,
  AISuggestion,
} from '../types';
import * as AppointmentService from '../services/appointment-service';
import { formatServiceType } from '../types';
import { isToday } from '../../../../packages/utils/date';
import { errorMessage } from '../../../../packages/utils/service-helpers';

function enrichAppointments(
  appointments: Appointment[],
  customers: Customer[],
  technicians: Technician[]
): AppointmentwithDetails[] {
  const custMap = new Map(customers.map((c) => [c.id, c]));
  const techMap = new Map(technicians.map((t) => [t.id, t]));
  return appointments.map((a) => ({
    ...a,
    customer_name: custMap.get(a.customer_id)?.name,
    customer_phone: custMap.get(a.customer_id)?.phone,
    technician_name: a.technician_id
      ? techMap.get(a.technician_id)?.name
      : undefined,
  }));
}

function groupAppointments(
  appointments: AppointmentwithDetails[]
): AppointmentGroup[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const today: AppointmentwithDetails[] = [];
  const upcoming: AppointmentwithDetails[] = [];
  const followup: AppointmentwithDetails[] = [];
  const past: AppointmentwithDetails[] = [];

  for (const a of appointments) {
    const d = new Date(a.date);
    if (a.status === 'needs_followup') {
      followup.push(a);
    } else if (isToday(a.date)) {
      today.push(a);
    } else if (d >= todayStart && a.status !== 'cancelled' && a.status !== 'completed') {
      upcoming.push(a);
    } else if (d < todayStart) {
      past.push(a);
    }
  }

  const sortByDate = (arr: AppointmentwithDetails[]) =>
    arr.sort(
      (a: AppointmentwithDetails, b: AppointmentwithDetails) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

  const result: AppointmentGroup[] = [];
  if (today.length)
    result.push({ section: 'today', title: 'Today', items: sortByDate(today) });
  if (upcoming.length)
    result.push({
      section: 'upcoming',
      title: 'Upcoming',
      items: sortByDate(upcoming),
    });
  if (followup.length)
    result.push({
      section: 'followup',
      title: 'Needs follow-up',
      items: sortByDate(followup),
    });
  if (past.length)
    result.push({
      section: 'past',
      title: 'Past (last 10)',
      items: sortByDate(past).slice(-10),
    });

  return result;
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<AppointmentwithDetails[]>(
    []
  );
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentwithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);

  const loadRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appts, customers, techs] = await Promise.all([
        AppointmentService.fetchAppointments(),
        AppointmentService.fetchCustomers(),
        AppointmentService.fetchTechnicians(),
      ]);
      const enriched = enrichAppointments(appts, customers, techs);
      setAppointments(enriched);
      setTechnicians(techs);
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loadRef.current) {
      loadRef.current = true;
      load();
    }
  }, [load]);

  const updateStatus = useCallback(
    async (appointmentId: string, status: string) => {
      await AppointmentService.updateAppointmentStatus(appointmentId, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
      );
      setSelectedAppointment((prev) =>
        prev && prev.id === appointmentId ? { ...prev, status } : prev
      );
    },
    []
  );

  const assignTech = useCallback(
    async (appointmentId: string, techId: string, techName: string) => {
      await AppointmentService.assignTechnician(
        appointmentId,
        techId,
        techName
      );
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? { ...a, technician_id: techId, technician_name: techName }
            : a
        )
      );
      setSelectedAppointment((prev) =>
        prev && prev.id === appointmentId
          ? { ...prev, technician_id: techId, technician_name: techName }
          : prev
      );
    },
    []
  );

  const suggestTech = useCallback(async () => {
    if (!selectedAppointment) return;
    setSuggesting(true);
    setSuggestion(null);
    try {
      const availableTechs = technicians
        .filter((t) => t.status === 'active')
        .map((t) => ({
          name: t.name,
          skill: t.skill,
          availability: t.availability || 'unknown',
        }));
      const result = await AppointmentService.suggestTechnician({
        serviceType: formatServiceType(selectedAppointment.service_type),
        date: selectedAppointment.date,
        customerName: selectedAppointment.customer_name || 'Unknown',
        availableTechs,
      });
      setSuggestion(result);
    } catch {
      setSuggestion(null);
    } finally {
      setSuggesting(false);
    }
  }, [selectedAppointment, technicians]);

  const groups = useMemo(() => groupAppointments(appointments), [appointments]);
  const todayCount = useMemo(
    () => appointments.filter((a) => isToday(a.date)).length,
    [appointments],
  );
  const unassignedCount = useMemo(
    () =>
      appointments.filter(
        (a) =>
          (a.status === 'scheduled' || a.status === 'in_progress') &&
          !a.technician_id,
      ).length,
    [appointments],
  );
  const followupCount = useMemo(
    () => appointments.filter((a) => a.status === 'needs_followup').length,
    [appointments],
  );

  return {
    loading,
    error,
    appointments,
    technicians,
    selectedAppointment,
    todayCount,
    unassignedCount,
    followupCount,
    groups,
    suggesting,
    suggestion,
    selectAppointment: setSelectedAppointment,
    refresh: load,
    updateStatus,
    assignTech,
    suggestTech,
    clearSuggestion: () => setSuggestion(null),
  };
}
