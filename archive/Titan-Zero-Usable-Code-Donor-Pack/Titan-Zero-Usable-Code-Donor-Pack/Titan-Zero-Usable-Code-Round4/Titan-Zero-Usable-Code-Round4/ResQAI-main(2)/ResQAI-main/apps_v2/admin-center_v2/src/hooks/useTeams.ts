import { useState, useEffect, useCallback } from 'react';
import type { TeamDTO } from '../models';
import { listTeams, createTeam } from '../services/admin-service';
import type { CreateTeamRequest } from '../models';

interface UseTeamsResult { data: TeamDTO[]; total: number; loading: boolean; error: string | null; create: (req: CreateTeamRequest) => Promise<void>; refetch: () => void; }

export function useTeams(): UseTeamsResult {
  const [data, setData] = useState<TeamDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const refetch = useCallback(() => setRefresh(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    listTeams().then(res => { if (!cancelled) { setData(res.data); setTotal(res.total); setLoading(false); } }).catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [refresh]);

  const create = useCallback(async (req: CreateTeamRequest) => { await createTeam(req); refetch(); }, [refetch]);

  return { data, total, loading, error, create, refetch };
}
