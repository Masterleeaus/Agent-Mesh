import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface NotificationToast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextValue {
  currentUser: { id: string; name: string; role: string; permissions: string[] } | null;
  activeFilters: Record<string, any>;
  dateRange: { start: string; end: string } | null;
  viewMode: 'day' | 'week' | 'month' | 'timeline';
  selectedTechnician: string | null;
  selectedAppointmentIds: string[];
  sidebarCollapsed: boolean;
  offline: boolean;
  notifications: NotificationToast[];
  setActiveFilters: (filters: Record<string, any>) => void;
  setDateRange: (range: { start: string; end: string } | null) => void;
  setViewMode: (mode: 'day' | 'week' | 'month' | 'timeline') => void;
  setSelectedTechnician: (id: string | null) => void;
  toggleAppointmentSelection: (id: string) => void;
  clearSelection: () => void;
  toggleSidebar: () => void;
  setOffline: (offline: boolean) => void;
  addNotification: (n: Omit<NotificationToast, 'id'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

let notifIdCounter = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser] = useState({ id: 'u1', name: 'Admin', role: 'admin', permissions: [] as string[] });
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'timeline'>('week');
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [offline, setOffline] = useState(false);
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);

  const toggleAppointmentSelection = useCallback((id: string) => {
    setSelectedAppointmentIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedAppointmentIds([]);
  }, []);

  const addNotification = useCallback((n: Omit<NotificationToast, 'id'>) => {
    const id = `notif-${++notifIdCounter}`;
    setNotifications(prev => [...prev, { ...n, id }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(item => item.id !== id));
    }, 6000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, activeFilters, dateRange, viewMode, selectedTechnician,
      selectedAppointmentIds, sidebarCollapsed, offline, notifications,
      setActiveFilters: useCallback((f) => setActiveFilters(f), []),
      setDateRange: useCallback((r) => setDateRange(r), []),
      setViewMode: useCallback((m) => setViewMode(m), []),
      setSelectedTechnician: useCallback((id) => setSelectedTechnician(id), []),
      toggleAppointmentSelection,
      clearSelection,
      toggleSidebar: useCallback(() => setSidebarCollapsed(p => !p), []),
      setOffline: useCallback((o) => setOffline(o), []),
      addNotification,
      dismissNotification,
      clearNotifications,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
