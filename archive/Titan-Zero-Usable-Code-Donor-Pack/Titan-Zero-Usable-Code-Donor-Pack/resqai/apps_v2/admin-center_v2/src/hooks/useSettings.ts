import { useState, useEffect, useCallback } from 'react';
import type { SystemSettingDTO } from '../models';
import { listSettings, updateSetting as updateSettingService } from '../services/admin-service';
import type { UpdateSettingRequest } from '../models';

interface UseSettingsResult { data: SystemSettingDTO[]; loading: boolean; error: string | null; updateSetting: (key: string, req: UpdateSettingRequest) => Promise<void>; }

export function useSettings(): UseSettingsResult {
  const [data, setData] = useState<SystemSettingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const refetch = useCallback(() => setRefresh(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listSettings().then(res => { if (!cancelled) { setData(res.data); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load settings'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [refresh]);

  const updateSetting = useCallback(async (key: string, req: UpdateSettingRequest) => {
    await updateSettingService(key, req);
    refetch();
  }, [refetch]);

  return { data, loading, error, updateSetting };
}
