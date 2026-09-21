import { useState, useEffect, useCallback } from 'react';
import type { AuditLogEntryDTO, AuditLogFilterRequest } from '../models';
import { listAuditLog } from '../services/admin-service';

interface UseAuditLogResult { data: AuditLogEntryDTO[]; total: number; loading: boolean; error: string | null; refetch: () => void; }

export function useAuditLog(filter?: AuditLogFilterRequest, page = 1, pageSize = 20): UseAuditLogResult {
  const [data, setData] = useState<AuditLogEntryDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const refetch = useCallback(() => setRefresh(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listAuditLog(filter, page, pageSize).then(res => { if (!cancelled) { setData(res.data); setTotal(res.total); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load audit log'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [filter, page, pageSize, refresh]);

  return { data, total, loading, error, refetch };
}
