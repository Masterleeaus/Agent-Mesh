import { useAppointments, useAppointmentStats } from './index';
import { AppointmentStatus } from '../models/dto';
import { useMemo } from 'react';

export function useDashboard() {
  const { appointments, loading: apptsLoading, error: apptsError, refetch: refetchAppts } = useAppointments({ pageSize: 100 });
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useAppointmentStats();

  const todayAppointments = useMemo(() =>
    appointments.filter(a => a.date === new Date().toISOString().split('T')[0]),
    [appointments]
  );

  const upcomingAppointments = useMemo(() =>
    appointments.filter(a => a.date > new Date().toISOString().split('T')[0] && a.status !== AppointmentStatus.Cancelled),
    [appointments]
  );

  const overdueAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(a => a.date < today && a.status !== AppointmentStatus.Completed && a.status !== AppointmentStatus.Cancelled);
  }, [appointments]);

  const pendingAssignmentAppointments = useMemo(() =>
    appointments.filter(a => !a.technicianId && a.status !== AppointmentStatus.Cancelled),
    [appointments]
  );

  const completedTodayAppointments = useMemo(() =>
    appointments.filter(a => a.status === AppointmentStatus.Completed &&
      a.completedAt?.startsWith(new Date().toISOString().split('T')[0])),
    [appointments]
  );

  return {
    stats,
    todayAppointments,
    upcomingAppointments,
    overdueAppointments,
    pendingAssignmentAppointments,
    completedTodayAppointments,
    loading: apptsLoading || statsLoading,
    error: apptsError || statsError,
    refetch: () => { refetchAppts(); refetchStats(); },
  };
}
