import { createContext, useContext, useState, useCallback, type ReactNode, type FC } from 'react';
import type { JobListFilters } from '../models/api-requests';

export type ViewMode = 'list' | 'calendar';
export type NetworkStatus = 'online' | 'offline';
export type GpsStatus = 'enabled' | 'disabled';

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
  activeFilters: JobListFilters;
  selectedJobIds: string[];
  viewMode: ViewMode;
  networkStatus: NetworkStatus;
  gpsStatus: GpsStatus;
  isSyncing: boolean;
  pendingSyncCount: number;
  notifications: NotificationToast[];
}

export interface AppContextValue extends AppState {
  setCurrentUser: (id: string, name: string, roles: string[], permissions: string[]) => void;
  setActiveFilters: (filters: JobListFilters) => void;
  setSelectedJobIds: (ids: string[]) => void;
  toggleJobSelection: (id: string) => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
  setNetworkStatus: (status: NetworkStatus) => void;
  setGpsStatus: (status: GpsStatus) => void;
  setIsSyncing: (syncing: boolean) => void;
  setPendingSyncCount: (count: number) => void;
  addNotification: (toast: Omit<NotificationToast, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const defaultState: AppState = {
  currentUserId: 'tech-001',
  currentUserName: 'Marcus Rivera',
  currentUserRoles: ['technician', 'senior_technician'],
  currentUserPermissions: [
    'technician:view_dashboard',
    'technician:view_jobs',
    'technician:view_job_detail',
    'technician:accept_job',
    'technician:reject_job',
    'technician:update_progress',
    'technician:add_notes',
    'technician:upload_photos',
    'technician:upload_videos',
    'technician:capture_signature',
    'technician:use_parts',
    'technician:request_inventory',
    'technician:pause_job',
    'technician:resume_job',
    'technician:escalate_job',
    'technician:complete_job',
    'technician:view_messages',
    'technician:send_message',
    'technician:view_notifications',
    'technician:view_history',
    'technician:view_profile',
    'technician:edit_settings',
  ],
  activeFilters: {},
  selectedJobIds: [],
  viewMode: 'list',
  networkStatus: 'online',
  gpsStatus: 'enabled',
  isSyncing: false,
  pendingSyncCount: 0,
  notifications: [],
};

let notifCounter = 0;

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);

  const setCurrentUser = useCallback((id: string, name: string, roles: string[], permissions: string[]) => {
    setState(s => ({ ...s, currentUserId: id, currentUserName: name, currentUserRoles: roles, currentUserPermissions: permissions }));
  }, []);

  const setActiveFilters = useCallback((filters: JobListFilters) => {
    setState(s => ({ ...s, activeFilters: filters }));
  }, []);

  const setSelectedJobIds = useCallback((ids: string[]) => {
    setState(s => ({ ...s, selectedJobIds: ids }));
  }, []);

  const toggleJobSelection = useCallback((id: string) => {
    setState(s => ({
      ...s,
      selectedJobIds: s.selectedJobIds.includes(id)
        ? s.selectedJobIds.filter(x => x !== id)
        : [...s.selectedJobIds, id],
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(s => ({ ...s, selectedJobIds: [] }));
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(s => ({ ...s, viewMode: mode }));
  }, []);

  const setNetworkStatus = useCallback((status: NetworkStatus) => {
    setState(s => ({ ...s, networkStatus: status }));
  }, []);

  const setGpsStatus = useCallback((status: GpsStatus) => {
    setState(s => ({ ...s, gpsStatus: status }));
  }, []);

  const setIsSyncing = useCallback((syncing: boolean) => {
    setState(s => ({ ...s, isSyncing: syncing }));
  }, []);

  const setPendingSyncCount = useCallback((count: number) => {
    setState(s => ({ ...s, pendingSyncCount: count }));
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
      setSelectedJobIds,
      toggleJobSelection,
      clearSelection,
      setViewMode,
      setNetworkStatus,
      setGpsStatus,
      setIsSyncing,
      setPendingSyncCount,
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
