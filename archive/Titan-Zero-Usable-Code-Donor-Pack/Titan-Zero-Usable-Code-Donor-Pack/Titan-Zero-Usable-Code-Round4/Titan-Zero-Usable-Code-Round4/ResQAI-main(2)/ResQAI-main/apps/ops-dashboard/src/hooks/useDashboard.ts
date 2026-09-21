import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DashboardData, Ticket, KpiSummary, CoordinatorResponse, OperationsLogEntry } from '../types';
import { errorMessage } from '../../../../packages/utils/service-helpers';
import {
  fetchDashboardData,
  runCoordinator,
  fetchOperationsLog,
} from '../services/dashboard-service';

function computeKpi(data: DashboardData): KpiSummary {
  const openTickets = data.tickets.filter((t) => t.status !== 'closed').length;
  const urgentTickets = data.tickets.filter(
    (t) => t.urgency === 'urgent' && t.status !== 'closed'
  ).length;

  const activeAppointments = data.appointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'in_progress'
  ).length;
  const inProgressAppointments = data.appointments.filter(
    (a) => a.status === 'in_progress'
  ).length;

  const openDisputes = data.disputes.filter(
    (d) => d.status === 'open' || d.status === 'analyzing' || d.status === 'recommendation_ready'
  ).length;
  const awaitingApprovalDisputes = data.disputes.filter(
    (d) => d.status === 'recommendation_ready'
  ).length;

  const now = new Date();
  const overdueTasks = data.tasks.filter((t) => {
    if (t.status === 'done') return false;
    if (!t.due_date) return false;
    return new Date(t.due_date) < now;
  }).length;

  return {
    openTickets,
    urgentTickets,
    activeAppointments,
    inProgressAppointments,
    openDisputes,
    awaitingApprovalDisputes,
    overdueTasks,
    hasOverdueTasks: overdueTasks > 0,
  };
}

function getUrgentTickets(data: DashboardData): Ticket[] {
  return data.tickets.filter(
    (t) => t.urgency === 'urgent' && t.status !== 'closed' && t.status !== 'sent'
  );
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [coordinatorResult, setCoordinatorResult] = useState<CoordinatorResponse | null>(null);
  const [coordinatorLoading, setCoordinatorLoading] = useState(false);
  const [coordinatorError, setCoordinatorError] = useState<string | null>(null);
  const [operationsLog, setOperationsLog] = useState<OperationsLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const kpi = useMemo(() => (data ? computeKpi(data) : null), [data]);
  const urgentTickets = useMemo(() => (data ? getUrgentTickets(data) : []), [data]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardData, log] = await Promise.all([
        fetchDashboardData(),
        fetchOperationsLog(),
      ]);
      setData(dashboardData);
      setOperationsLog(log);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const runCoordinatorAction = useCallback(async () => {
    if (!data) return;
    try {
      setCoordinatorLoading(true);
      setCoordinatorError(null);

      const result = await runCoordinator();
      setCoordinatorResult(result);
    } catch (e) {
      setCoordinatorError(errorMessage(e));
    } finally {
      setCoordinatorLoading(false);
    }
  }, [data]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    state: {
      data,
      kpi,
      urgentTickets,
      coordinatorResult,
      coordinatorLoading,
      coordinatorError,
      operationsLog,
      loading,
      error,
    },
    refresh,
    runCoordinatorAction,
  };
}
