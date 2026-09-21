import { createContext, useContext } from 'react';
import type {
  AppointmentwithDetails,
  Technician,
  AISuggestion,
  AppointmentGroup,
} from '../types';

export interface AppState {
  loading: boolean;
  error: string | null;
  appointments: AppointmentwithDetails[];
  technicians: Technician[];
  selectedAppointment: AppointmentwithDetails | null;
  todayCount: number;
  unassignedCount: number;
  followupCount: number;
  groups: AppointmentGroup[];
  suggesting: boolean;
  suggestion: AISuggestion | null;
  selectAppointment: (apt: AppointmentwithDetails | null) => void;
  refresh: () => Promise<void>;
  updateStatus: (appointmentId: string, status: string) => Promise<void>;
  assignTech: (
    appointmentId: string,
    techId: string,
    techName: string
  ) => Promise<void>;
  suggestTech: () => Promise<void>;
  clearSuggestion: () => void;
}

export const AppStateContext = createContext<AppState | null>(null);

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx)
    throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
