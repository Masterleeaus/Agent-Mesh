import { createContext, useContext, useState, useCallback, type ReactNode, type FC } from 'react';
import type { TicketListFilters } from '../models/api-requests';

export type ViewMode = 'table' | 'kanban';

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
  activeFilters: TicketListFilters;
  selectedTicketIds: string[];
  viewMode: ViewMode;
  notifications: NotificationToast[];
}

export interface AppContextValue extends AppState {
  setCurrentUser: (id: string, name: string, roles: string[], permissions: string[]) => void;
  setActiveFilters: (filters: TicketListFilters) => void;
  setSelectedTicketIds: (ids: string[]) => void;
  toggleTicketSelection: (id: string) => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
  addNotification: (toast: Omit<NotificationToast, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const defaultState: AppState = {
  currentUserId: 'agent-001',
  currentUserName: 'Sarah Connor',
  currentUserRoles: ['agent'],
  currentUserPermissions: [
    'support:view_tickets',
    'support:create_ticket',
    'support:draft_reply',
    'support:approve_reply',
    'support:escalate',
    'support:manage_templates',
    'support:manage_queues',
    'support:view_sla',
  ],
  activeFilters: {},
  selectedTicketIds: [],
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

  const setActiveFilters = useCallback((filters: TicketListFilters) => {
    setState(s => ({ ...s, activeFilters: filters }));
  }, []);

  const setSelectedTicketIds = useCallback((ids: string[]) => {
    setState(s => ({ ...s, selectedTicketIds: ids }));
  }, []);

  const toggleTicketSelection = useCallback((id: string) => {
    setState(s => ({
      ...s,
      selectedTicketIds: s.selectedTicketIds.includes(id)
        ? s.selectedTicketIds.filter(x => x !== id)
        : [...s.selectedTicketIds, id],
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(s => ({ ...s, selectedTicketIds: [] }));
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
      setSelectedTicketIds,
      toggleTicketSelection,
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
