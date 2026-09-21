import { useState, useCallback } from 'react';
import type { HealthScanDTO, RunHealthScanRequest } from '../models';

const MOCK_SCANS: HealthScanDTO[] = [
  { id: 'scan-1', scanDate: new Date(Date.now() - 7 * 86400000).toISOString(), accountsScanned: 124, criticalCount: 8, slippingCount: 16, watchCount: 32, healthyCount: 68, triggeredBy: 'scheduled', completedAt: new Date(Date.now() - 7 * 86400000 + 30000).toISOString() },
  { id: 'scan-2', scanDate: new Date(Date.now() - 14 * 86400000).toISOString(), accountsScanned: 120, criticalCount: 10, slippingCount: 14, watchCount: 30, healthyCount: 66, triggeredBy: 'manual', triggerReason: 'Monthly audit', completedAt: new Date(Date.now() - 14 * 86400000 + 45000).toISOString() },
];

export function useHealthScans() {
  const [data, setData] = useState<HealthScanDTO[]>(MOCK_SCANS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScan = useCallback(async (_req: RunHealthScanRequest) => {
    setLoading(true);
    setError(null);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newScan: HealthScanDTO = {
          id: `scan-${Date.now()}`,
          scanDate: new Date().toISOString(),
          accountsScanned: 124,
          criticalCount: 8,
          slippingCount: 16,
          watchCount: 32,
          healthyCount: 68,
          triggeredBy: 'manual',
          triggerReason: _req.triggerReason,
          completedAt: new Date().toISOString(),
        };
        setData((prev) => [newScan, ...prev]);
        setLoading(false);
        resolve();
      }, 2000);
    });
  }, []);

  return { data, loading, error, runScan };
}
