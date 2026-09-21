import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { NotificationListItemVM } from '../models/view-models';

interface UseNotificationsResult {
  data: NotificationListItemVM[];
  total: number;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refetch: (page?: number) => void;
}

export function useNotifications(page: number = 1): UseNotificationsResult {
  const [data, setData] = useState<NotificationListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback((p: number = page) => {
    setLoading(true);
    setError(null);
    CustomerService.listNotifications(p)
      .then((result) => { setData(result.notifications); setTotal(result.total); setUnreadCount(result.unreadCount); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notifications'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const markRead = useCallback(async (id: string) => {
    await CustomerService.markNotificationRead(id);
    setData((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await CustomerService.markAllNotificationsRead();
    setData((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return { data, total, unreadCount, loading, error, markRead, markAllRead, refetch: fetch };
}