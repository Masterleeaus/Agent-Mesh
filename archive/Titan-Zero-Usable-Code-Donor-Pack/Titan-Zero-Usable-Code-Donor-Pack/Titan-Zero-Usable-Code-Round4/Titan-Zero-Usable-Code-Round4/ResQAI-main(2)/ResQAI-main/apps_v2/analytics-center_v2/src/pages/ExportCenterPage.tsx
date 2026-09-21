import { useState } from 'react';
import { useExportHistory } from '../hooks/useExportHistory';
import { ExportReportForm, ExportConfirmationDialog, ExportHistoryTable, DataFreshnessIndicator } from '../components';
import { ErrorState, EmptyState, Card } from '../../../../shared/src/components';
import { analyticsService } from '../services/analytics-service';
import type { ExportFormat, DateRangePreset } from '../models/dto';

export function ExportCenterPage() {
  const { data: history, loading, error, refetch } = useExportHistory();
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv' as ExportFormat);
  const [showConfirm, setShowConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportRequest = (data: { format: ExportFormat; dateRange: DateRangePreset }) => {
    setExportFormat(data.format);
    setShowConfirm(true);
  };

  const handleConfirmExport = async () => {
    setExporting(true);
    try {
      await analyticsService.exportData({ format: exportFormat, dateRange: { preset: 'last30Days' as DateRangePreset }, filters: {} });
      setShowConfirm(false);
      refetch();
    } catch {} finally { setExporting(false); }
  };

  if (error) return <ErrorState title="Failed to load" message={error} onRetry={refetch} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Export Center</h1>
        <DataFreshnessIndicator lastUpdated={new Date().toISOString()} loading={loading} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <ExportReportForm onExport={handleExportRequest} loading={exporting} />

        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>Export Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#8b9bb5' }}>
            <p style={{ margin: 0 }}>Supported formats: CSV, PDF, JSON, XLSX</p>
            <p style={{ margin: 0 }}>Exports are available for download for 7 days</p>
            <p style={{ margin: 0 }}>Large exports may take several minutes to process</p>
            <p style={{ margin: 0 }}>Export history is retained for 90 days</p>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <ExportHistoryTable
          title="Export History"
          rows={(history || []).map((h) => ({
            id: h.id, reportName: h.reportName, format: h.format,
            status: h.status, requestedBy: h.requestedBy,
            requestedAt: h.requestedAt, completedAt: h.completedAt,
            fileUrl: h.fileUrl, fileSize: h.fileSize ? `${(h.fileSize / 1024).toFixed(0)} KB` : null,
          }))}
          loading={loading}
          onDownload={(id) => {}}
        />
      </div>

      <ExportConfirmationDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmExport}
        format={exportFormat}
        loading={exporting}
      />
    </div>
  );
}
