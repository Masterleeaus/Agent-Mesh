import { useState, useEffect } from 'react';
import { CustomerService } from '../services/customer-service';
import type { AccountHealthVM } from '../models/view-models';
import type { AccountDTO, FollowupDTO } from '../models/dto';

interface UseAccountHealthResult {
  account: AccountDTO | null;
  health: AccountHealthVM | null;
  followups: FollowupDTO[];
  loading: boolean;
  error: string | null;
}

export function useAccountHealth(): UseAccountHealthResult {
  const [account, setAccount] = useState<AccountDTO | null>(null);
  const [health, setHealth] = useState<AccountHealthVM | null>(null);
  const [followups, setFollowups] = useState<FollowupDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    CustomerService.getAccountHealth()
      .then((result) => { if (!cancelled) { setAccount(result.account); setHealth(result.health); setFollowups(result.followups); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load account health'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { account, health, followups, loading, error };
}
