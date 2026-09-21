import { useState, useEffect, useCallback } from 'react';
import type { NotificationDTO, NotificationFilterRequest } from '../models';
import { listNotifications, markNotificationRead, dismissNotification } from '../services/admin-service';

interface UseNotificationsResult { data: NotificationDTO[]; total: number; loading: boolean; error: string | null; markRead: (id: string) => Promise<void>; dismiss: (id: string) => Promise<void>; refetch: () => void; }

export function useNotifications(filter?: NotificationFilterRequest): UseNotificationsResult {
  const [data, setData] = useState<NotificationDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const refetch = useCallback(() => setRefresh(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    listNotifications(filter).then(res => { if (!cancelled) { setData(res.data); setTotal(res.total); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [filter, refresh]);

  const markRead = useCallback(async (id: string) => { await markNotificationRead(id); refetch(); }, [refetch]);
  const dismiss = useCallback(async (id: string) => { await dismissNotification(id); refetch(); }, [refetch]);

  return { data, total, loading, error, markRead, dismiss, refetch };
}
