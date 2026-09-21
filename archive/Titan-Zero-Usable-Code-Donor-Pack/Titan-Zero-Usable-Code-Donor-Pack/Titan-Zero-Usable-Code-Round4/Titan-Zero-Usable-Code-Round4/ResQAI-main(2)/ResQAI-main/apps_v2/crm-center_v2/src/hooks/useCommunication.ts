import { useState, useEffect, useCallback } from 'react';
import type { CommunicationCenterVM } from '../models';

const MOCK_COMMUNICATION: CommunicationCenterVM = {
  recentCommunications: [],
  scheduledFollowups: [],
  pendingOutreach: 12,
  lastOutreachDate: new Date(Date.now() - 1 * 86400000).toISOString(),
  channelsBreakdown: [
    { channel: 'phone', count: 45 },
    { channel: 'email', count: 120 },
    { channel: 'chat', count: 78 },
    { channel: 'portal', count: 34 },
    { channel: 'in_person', count: 22 },
  ],
};

export function useCommunication() {
  const [data, setData] = useState<CommunicationCenterVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_COMMUNICATION);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
