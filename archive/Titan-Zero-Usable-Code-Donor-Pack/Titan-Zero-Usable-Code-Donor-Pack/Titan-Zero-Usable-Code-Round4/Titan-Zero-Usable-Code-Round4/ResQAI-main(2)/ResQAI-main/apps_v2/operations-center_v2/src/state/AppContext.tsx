import { createContext, useContext, useState, useCallback, type ReactNode, type FC } from 'react';
import type { OperationsListFilters } from '../models/api-requests';

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
  activeFilters: OperationsListFilters;
  selectedOperationIds: string[];
  notifications: NotificationToast[];
}

export interface AppContextValue extends AppState {
  setCurrentUser: (id: string, name: string, roles: string[], permissions: string[]) => void;
  setActiveFilters: (filters: OperationsListFilters) => void;
  setSelectedOperationIds: (ids: string[]) => void;
  toggleOperationSelection: (id: string) => void;
  clearSelection: () => void;
  addNotification: (toast: Omit<NotificationToast, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const defaultState: AppState = {
  currentUserId: 'ops-manager-001',
  currentUserName: 'Marcus Kane',
  currentUserRoles: ['operations_manager'],
  currentUserPermissions: [
    'ops:view_dashboard',
    'ops:view_dispatch_queue',
    'ops:create_dispatch',
    'ops:view_live_board',
    'ops:view_assignments',
    'ops:assign_technician',
    'ops:reassign_technician',
    'ops:monitor_technicians',
    'ops:view_escalations',
    'ops:escalate_operation',
    'ops:close_operation',
    'ops:update_operation_status',
    'ops:view_timeline',
    'ops:view_daily_ops',
    'ops:view_regional_ops',
    'ops:view_completed_ops',
    'ops:view_reports',
    'ops:search_operations',
  ],
  activeFilters: {},
  selectedOperationIds: [],
  notifications: [],
};

let notifCounter = 0;

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);

  const setCurrentUser = useCallback((id: string, name: string, roles: string[], permissions: string[]) => {
    setState(s => ({ ...s, currentUserId: id, currentUserName: name, currentUserRoles: roles, currentUserPermissions: permissions }));
  }, []);

  const setActiveFilters = useCallback((filters: OperationsListFilters) => {
    setState(s => ({ ...s, activeFilters: filters }));
  }, []);

  const setSelectedOperationIds = useCallback((ids: string[]) => {
    setState(s => ({ ...s, selectedOperationIds: ids }));
  }, []);

  const toggleOperationSelection = useCallback((id: string) => {
    setState(s => ({
      ...s,
      selectedOperationIds: s.selectedOperationIds.includes(id)
        ? s.selectedOperationIds.filter(x => x !== id)
        : [...s.selectedOperationIds, id],
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(s => ({ ...s, selectedOperationIds: [] }));
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
      setSelectedOperationIds,
      toggleOperationSelection,
      clearSelection,
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
