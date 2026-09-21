import { useState } from 'react';
import { Card, Dropdown, Input, Button } from '../../../../shared/src/components';
import type { ReportFrequency, ExportFormat } from '../models/dto';

interface ScheduleReportFormProps {
  onSchedule: (data: { frequency: ReportFrequency; recipients: string[]; format: ExportFormat }) => void;
  loading?: boolean;
}

const frequencies: Array<{ value: ReportFrequency; label: string }> = [
  { value: 'daily' as ReportFrequency, label: 'Daily' },
  { value: 'weekly' as ReportFrequency, label: 'Weekly' },
  { value: 'biweekly' as ReportFrequency, label: 'Biweekly' },
  { value: 'monthly' as ReportFrequency, label: 'Monthly' },
  { value: 'quarterly' as ReportFrequency, label: 'Quarterly' },
];

const formats: Array<{ value: ExportFormat; label: string }> = [
  { value: 'pdf' as ExportFormat, label: 'PDF' },
  { value: 'csv' as ExportFormat, label: 'CSV' },
  { value: 'xlsx' as ExportFormat, label: 'XLSX' },
];

export function ScheduleReportForm({ onSchedule, loading }: ScheduleReportFormProps) {
  const [frequency, setFrequency] = useState<ReportFrequency>('weekly' as ReportFrequency);
  const [recipients, setRecipients] = useState('');
  const [format, setFormat] = useState<ExportFormat>('pdf' as ExportFormat);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emails = recipients.split(',').map((r) => r.trim()).filter(Boolean);
    if (emails.length === 0) return;
    onSchedule({ frequency, recipients: emails, format });
  };

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16 }}>Schedule Report</div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Dropdown label="Frequency" options={frequencies} value={frequency} onChange={(v: ReportFrequency) => setFrequency(v)} />
        <Input label="Recipients (comma-separated)" value={recipients} onChange={(e) => setRecipients(e)} placeholder="email1@example.com, email2@example.com" required />
        <Dropdown label="Format" options={formats} value={format} onChange={(v: ExportFormat) => setFormat(v)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button type="submit" variant="primary" loading={loading}>Create Schedule</Button>
        </div>
      </form>
    </Card>
  );
}
