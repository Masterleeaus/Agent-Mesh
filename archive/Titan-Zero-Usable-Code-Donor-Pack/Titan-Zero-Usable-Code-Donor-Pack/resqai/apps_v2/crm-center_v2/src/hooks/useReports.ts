import { useState, useEffect, useCallback } from 'react';

interface ReportData {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  period: string;
  status: 'ready' | 'generating';
}

const MOCK_REPORTS: ReportData[] = [
  { id: 'rpt-1', name: 'Monthly Customer Health Report', type: 'health', generatedAt: new Date(Date.now() - 1 * 86400000).toISOString(), period: 'June 2025', status: 'ready' },
  { id: 'rpt-2', name: 'Follow-up Compliance Report', type: 'compliance', generatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), period: 'Q2 2025', status: 'ready' },
  { id: 'rpt-3', name: 'Satisfaction Trends', type: 'satisfaction', generatedAt: new Date(Date.now() - 5 * 86400000).toISOString(), period: 'H1 2025', status: 'ready' },
  { id: 'rpt-4', name: 'Opportunity Pipeline Summary', type: 'pipeline', generatedAt: new Date(Date.now() - 3 * 86400000).toISOString(), period: 'June 2025', status: 'ready' },
  { id: 'rpt-5', name: 'Retention Analysis', type: 'retention', generatedAt: new Date(Date.now() - 7 * 86400000).toISOString(), period: 'Q2 2025', status: 'ready' },
  { id: 'rpt-6', name: 'Feedback Summary Report', type: 'feedback', generatedAt: new Date(Date.now() - 4 * 86400000).toISOString(), period: 'June 2025', status: 'ready' },
];

export function useReports() {
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_REPORTS);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
