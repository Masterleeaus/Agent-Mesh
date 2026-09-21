import { useState } from 'react';
import { Card, Dropdown, Button } from '../../../../shared/src/components';
import type { ExportFormat, DateRangePreset } from '../models/dto';

interface ExportReportFormProps {
  onExport: (data: { format: ExportFormat; dateRange: DateRangePreset }) => void;
  loading?: boolean;
}

const formats: Array<{ value: ExportFormat; label: string }> = [
  { value: 'csv' as ExportFormat, label: 'CSV' },
  { value: 'pdf' as ExportFormat, label: 'PDF' },
  { value: 'json' as ExportFormat, label: 'JSON' },
  { value: 'xlsx' as ExportFormat, label: 'XLSX' },
];

const ranges: Array<{ value: DateRangePreset; label: string }> = [
  { value: 'last7Days' as DateRangePreset, label: 'Last 7 Days' },
  { value: 'last30Days' as DateRangePreset, label: 'Last 30 Days' },
  { value: 'last90Days' as DateRangePreset, label: 'Last 90 Days' },
  { value: 'thisMonth' as DateRangePreset, label: 'This Month' },
  { value: 'thisQuarter' as DateRangePreset, label: 'This Quarter' },
  { value: 'thisYear' as DateRangePreset, label: 'This Year' },
];

export function ExportReportForm({ onExport, loading }: ExportReportFormProps) {
  const [format, setFormat] = useState<ExportFormat>('csv' as ExportFormat);
  const [dateRange, setDateRange] = useState<DateRangePreset>('last30Days' as DateRangePreset);

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16 }}>Export Report</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Dropdown label="Format" options={formats} value={format} onChange={(v: ExportFormat) => setFormat(v)} />
        <Dropdown label="Date Range" options={ranges} value={dateRange} onChange={(v: DateRangePreset) => setDateRange(v)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={() => onExport({ format, dateRange })} loading={loading}>Export</Button>
        </div>
      </div>
    </Card>
  );
}
