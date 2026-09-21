import { useState, useCallback } from 'react';
import type { ExportDataRequest } from '../models/api-requests';
import { analyticsService } from '../services/analytics-service';

interface UseExportResult {
  exportData: (request: ExportDataRequest) => Promise<void>;
  exporting: boolean;
  error: string | null;
}

export function useExport(): UseExportResult {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async (request: ExportDataRequest) => {
    setExporting(true);
    setError(null);
    try {
      await analyticsService.exportData(request);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportData, exporting, error };
}
