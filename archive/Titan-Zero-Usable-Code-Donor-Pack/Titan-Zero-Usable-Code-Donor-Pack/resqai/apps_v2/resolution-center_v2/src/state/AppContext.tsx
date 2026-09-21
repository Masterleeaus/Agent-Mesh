import { createContext, useContext, useState, useCallback, type ReactNode, type FC } from 'react';
import type { CaseListFilters, DisputeListFilters } from '../models/api-requests';

export type ViewMode = 'table' | 'card';

export interface NotificationToast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  timestamp: number;
}

export interface AppState {
  currentUserId: string;
  currentUserName: string;
  currentUserRoles: string[];
  currentUserPermissions: string[];
  activeFilters: CaseListFilters;
  activeDisputeFilters: DisputeListFilters;
  selectedCaseIds: string[];
  viewMode: ViewMode;
  notifications: NotificationToast[];
}

export interface AppContextValue extends AppState {
  setCurrentUser: (id: string, name: string, roles: string[], permissions: string[]) => void;
  setActiveFilters: (filters: CaseListFilters) => void;
  setActiveDisputeFilters: (filters: DisputeListFilters) => void;
  setSelectedCaseIds: (ids: string[]) => void;
  toggleCaseSelection: (id: string) => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
  addNotification: (toast: Omit<NotificationToast, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const defaultState: AppState = {
  currentUserId: 'res-001',
  currentUserName: 'Alex Morgan',
  currentUserRoles: ['resolution_specialist'],
  currentUserPermissions: [
    'resolution:view_dashboard',
    'resolution:view_pending',
    'resolution:view_disputes',
    'resolution:view_cases',
    'resolution:view_evidence',
    'resolution:view_technician_reports',
    'resolution:view_complaints',
    'resolution:view_approvals',
    'resolution:view_escalations',
    'resolution:view_history',
    'resolution:view_closed',
    'resolution:view_knowledge_base',
    'resolution:view_reports',
    'resolution:view_search',
    'resolution:create_resolution',
    'resolution:approve_resolution',
    'resolution:reject_resolution',
    'resolution:escalate_case',
    'resolution:close_case',
    'resolution:request_info',
    'resolution:manage_knowledge_base',
  ],
  activeFilters: {},
  activeDisputeFilters: {},
  selectedCaseIds: [],
  viewMode: 'table',
  notifications: [],
};

let notifCounter = 0;

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);

  const setCurrentUser = useCallback((id: string, name: string, roles: string[], permissions: string[]) => {
    setState(s => ({ ...s, currentUserId: id, currentUserName: name, currentUserRoles: roles, currentUserPermissions: permissions }));
  }, []);

  const setActiveFilters = useCallback((filters: CaseListFilters) => {
    setState(s => ({ ...s, activeFilters: filters }));
  }, []);

  const setActiveDisputeFilters = useCallback((filters: DisputeListFilters) => {
    setState(s => ({ ...s, activeDisputeFilters: filters }));
  }, []);

  const setSelectedCaseIds = useCallback((ids: string[]) => {
    setState(s => ({ ...s, selectedCaseIds: ids }));
  }, []);

  const toggleCaseSelection = useCallback((id: string) => {
    setState(s => ({
      ...s,
      selectedCaseIds: s.selectedCaseIds.includes(id)
        ? s.selectedCaseIds.filter(x => x !== id)
        : [...s.selectedCaseIds, id],
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(s => ({ ...s, selectedCaseIds: [] }));
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(s => ({ ...s, viewMode: mode }));
  }, []);

  const addNotification = useCallback((toast: Omit<NotificationToast, 'id' | 'timestamp'>) => {
    notifCounter += 1;
    const notification: NotificationToast = {
      ...toast,
      id: `notif-${notifCounter}`,
      timestamp: Date.now(),
    };
    setState(s => ({ ...s, notifications: [...s.notifications, notification] }));
    setTimeout(() => {
      setState(s => ({ ...s, notifications: s.notifications.filter(n => n.id !== notification.id) }));
    }, 6000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setState(s => ({ ...s, notifications: s.notifications.filter(n => n.id !== id) }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState(s => ({ ...s, notifications: [] }));
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      setCurrentUser,
      setActiveFilters,
      setActiveDisputeFilters,
      setSelectedCaseIds,
      toggleCaseSelection,
      clearSelection,
      setViewMode,
      addNotification,
      dismissNotification,
      clearNotifications,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider');
  return ctx;
}
