import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Dispute, Appointment, Customer } from '../types';
import { STATUS_WEIGHT } from '../types';
import type { ResolutionCenterState } from '../state/atoms';
import { errorMessage } from '../../../../packages/utils/service-helpers';
import { fetchDisputes, fetchAppointments, fetchCustomers } from '../services/dispute-service';

export function useDisputes() {
  const [state, setState] = useState<ResolutionCenterState>({
    disputes: [],
    appointments: [],
    customers: [],
    loading: true,
    error: null,
    selectedId: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [disputes, appointments, customers] = await Promise.all([
        fetchDisputes(),
        fetchAppointments(),
        fetchCustomers(),
      ]);
      setState((prev) => ({ ...prev, disputes, appointments, customers, loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, loading: false, error: errorMessage(err) }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectDispute = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedId: id }));
  }, []);

  const updateLocalDispute = useCallback((id: string, patch: Partial<Dispute>) => {
    setState((prev) => ({
      ...prev,
      disputes: prev.disputes.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  }, []);

  const sortedDisputes = useMemo(() => {
    return [...state.disputes].sort((a, b) => {
      const wa = STATUS_WEIGHT[a.status] ?? 99;
      const wb = STATUS_WEIGHT[b.status] ?? 99;
      return wa - wb;
    });
  }, [state.disputes]);

  const selectedDispute = useMemo(
    () => state.disputes.find((d) => d.id === state.selectedId) ?? null,
    [state.disputes, state.selectedId],
  );

  const selectedAppointment = useMemo(() => {
    if (!selectedDispute) return null;
    return state.appointments.find((a) => a.id === selectedDispute.appointment_id) ?? null;
  }, [selectedDispute, state.appointments]);

  const selectedCustomer = useMemo(() => {
    if (!selectedAppointment) return null;
    return state.customers.find((c) => c.id === selectedAppointment.customer_id) ?? null;
  }, [selectedAppointment, state.customers]);

  const kpis = useMemo(() => {
    const awaiting = state.disputes.filter((d) => d.status === 'recommendation_ready').length;
    const open = state.disputes.filter((d) => d.status === 'open' || d.status === 'analyzing' || d.status === 'recommendation_ready').length;
    const resolved = state.disputes.filter((d) => d.status === 'approved' || d.status === 'closed').length;
    return { awaitingApproval: awaiting, totalOpen: open, resolved };
  }, [state.disputes]);

  return {
    state,
    sortedDisputes,
    selectedDispute,
    selectedAppointment,
    selectedCustomer,
    kpis,
    selectDispute,
    refresh: load,
    updateLocalDispute,
  };
}
