import { useState, useEffect, useCallback } from 'react';
import type { DashboardVM } from '../models/view-models';
import { technicianService } from '../services/technician-service';

interface UseDashboardResult {
  dashboard: DashboardVM | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(): UseDashboardResult {
  const [dashboard, setDashboard] = useState<DashboardVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await technicianService.getDashboard();
      setDashboard({
        todayJobs: res.todayJobs.map(j => ({
          id: j.id, title: j.title, customerName: j.customerName,
          customerAddress: j.customerAddress, serviceType: j.serviceType,
          priority: j.priority, status: j.status,
          scheduledStart: j.scheduledStart, scheduledEnd: j.scheduledEnd,
          estimatedDuration: j.estimatedDuration,
          isUrgent: j.priority === 'urgent',
          isEscalated: j.status === 'escalated',
          latitude: j.latitude, longitude: j.longitude,
          travelDistance: j.travelDistance, travelDuration: j.travelDuration,
        })),
        currentJob: res.currentJob ? {
          id: res.currentJob.id, title: res.currentJob.title,
          customerName: res.currentJob.customerName,
          customerAddress: res.currentJob.customerAddress,
          serviceType: res.currentJob.serviceType,
          priority: res.currentJob.priority, status: res.currentJob.status,
          scheduledStart: res.currentJob.scheduledStart,
          scheduledEnd: res.currentJob.scheduledEnd,
          estimatedDuration: res.currentJob.estimatedDuration,
          isUrgent: res.currentJob.priority === 'urgent',
          isEscalated: res.currentJob.status === 'escalated',
        } : undefined,
        nextAppointment: res.nextAppointment ? {
          id: res.nextAppointment.id, title: res.nextAppointment.title,
          customerName: res.nextAppointment.customerName,
          customerAddress: res.nextAppointment.customerAddress,
          serviceType: res.nextAppointment.serviceType,
          priority: res.nextAppointment.priority, status: res.nextAppointment.status,
          scheduledStart: res.nextAppointment.scheduledStart,
          scheduledEnd: res.nextAppointment.scheduledEnd,
          estimatedDuration: res.nextAppointment.estimatedDuration,
          isUrgent: res.nextAppointment.priority === 'urgent',
          isEscalated: res.nextAppointment.status === 'escalated',
        } : undefined,
        urgentJobs: res.urgentJobs.map(j => ({
          id: j.id, title: j.title, customerName: j.customerName,
          customerAddress: j.customerAddress, serviceType: j.serviceType,
          priority: j.priority, status: j.status,
          scheduledStart: j.scheduledStart, scheduledEnd: j.scheduledEnd,
          estimatedDuration: j.estimatedDuration,
          isUrgent: true, isEscalated: j.status === 'escalated',
        })),
        completionRate: res.completionRate,
        totalJobsToday: res.totalJobsToday,
        completedJobsToday: res.completedJobsToday,
        unreadMessages: res.unreadMessages,
        unreadNotifications: res.unreadNotifications,
        travelStatus: res.travelStatus,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { dashboard, loading, error, refetch: fetch };
}
