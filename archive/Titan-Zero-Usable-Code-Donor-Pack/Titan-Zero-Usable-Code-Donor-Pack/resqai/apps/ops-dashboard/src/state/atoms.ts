import { createContext, useContext } from 'react';
import type { DashboardData, CoordinatorResponse, OperationsLogEntry, KpiSummary } from '../types';

export interface DashboardState {
  data: DashboardData | null;
  kpi: KpiSummary | null;
  urgentTickets: import('../types').Ticket[];
  coordinatorResult: CoordinatorResponse | null;
  coordinatorLoading: boolean;
  coordinatorError: string | null;
  operationsLog: OperationsLogEntry[];
  loading: boolean;
  error: string | null;
}

export const defaultState: DashboardState = {
  data: null,
  kpi: null,
  urgentTickets: [],
  coordinatorResult: null,
  coordinatorLoading: false,
  coordinatorError: null,
  operationsLog: [],
  loading: true,
  error: null,
};

export const DashboardContext = createContext<{
  state: DashboardState;
  refresh: () => Promise<void>;
  runCoordinatorAction: () => Promise<void>;
}>({
  state: defaultState,
  refresh: async () => {},
  runCoordinatorAction: async () => {},
});

export function useDashboardContext() {
  return useContext(DashboardContext);
}
