import { useState, useEffect, useCallback } from 'react';
import type { RiskSignalDTO } from '../models';

const MOCK_SIGNALS: RiskSignalDTO[] = [
  { id: 'rs-1', accountId: 'acc-4', customerName: 'Umbrella Co', type: 'Payment Default', severity: 'critical', description: 'Payment overdue by 45+ days. Immediate escalation required.', detectedAt: new Date(Date.now() - 2 * 86400000).toISOString(), acknowledged: false },
  { id: 'rs-2', accountId: 'acc-3', customerName: 'Initech', type: 'SLA Breach', severity: 'warning', description: 'Response time exceeding SLA threshold for 3 consecutive tickets.', detectedAt: new Date(Date.now() - 5 * 86400000).toISOString(), acknowledged: false },
  { id: 'rs-3', accountId: 'acc-7', customerName: 'Wayne Enterprises', type: 'Churn Risk', severity: 'warning', description: 'Engagement score dropped 40% in last 30 days.', detectedAt: new Date(Date.now() - 7 * 86400000).toISOString(), acknowledged: true, acknowledgedBy: 'Alice Johnson', acknowledgedAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: 'rs-4', accountId: 'acc-2', customerName: 'Globex Inc', type: 'Contract Expiry', severity: 'info', description: 'Annual contract expiring in 60 days.', detectedAt: new Date(Date.now() - 1 * 86400000).toISOString(), acknowledged: false },
];

export function useRiskSignals() {
  const [data, setData] = useState<RiskSignalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_SIGNALS);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
