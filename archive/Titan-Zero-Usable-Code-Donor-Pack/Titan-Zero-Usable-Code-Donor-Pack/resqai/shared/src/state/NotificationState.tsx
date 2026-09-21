import { createContext, useContext, useMemo, useState, useCallback, type ReactNode, type FC } from 'react';

export interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface NotificationStateContextValue {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const NotificationStateContext = createContext<NotificationStateContextValue | null>(null);

let counter = 0;

export const NotificationStateProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((notif: Omit<NotificationItem, 'id'>) => {
    const id = `notif-${++counter}`;
    setNotifications(prev => [...prev, { ...notif, id }]);
    if (notif.duration !== 0) {
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), notif.duration || 5000);
    }
    return id;
  }, []);

  const value = useMemo<NotificationStateContextValue>(() => ({
    notifications,
    addNotification,
    removeNotification: (id) => setNotifications(prev => prev.filter(n => n.id !== id)),
    clearAll: () => setNotifications([]),
  }), [notifications, addNotification]);
  return (
    <NotificationStateContext.Provider value={value}>
      {children}
    </NotificationStateContext.Provider>
  );
};

export function useNotificationState(): NotificationStateContextValue {
  const ctx = useContext(NotificationStateContext);
  if (!ctx) throw new Error('useNotificationState must be used within NotificationStateProvider');
  return ctx;
}
