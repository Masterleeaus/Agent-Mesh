import { useState } from 'react';
import { Card, Input, Dropdown, Button } from '../../../../shared/src/components';
import type { ChartType } from '../models/dto';

interface GenerateReportFormProps {
  onSubmit: (data: { name: string; description: string; chartType: ChartType }) => void;
  loading?: boolean;
}

const chartTypes: Array<{ value: ChartType; label: string }> = [
  { value: 'line' as ChartType, label: 'Line Chart' },
  { value: 'bar' as ChartType, label: 'Bar Chart' },
  { value: 'pie' as ChartType, label: 'Pie Chart' },
  { value: 'area' as ChartType, label: 'Area Chart' },
];

export function GenerateReportForm({ onSubmit, loading }: GenerateReportFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [chartType, setChartType] = useState<ChartType>('line' as ChartType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), chartType });
  };

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16 }}>Generate Report</div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Report Name" value={name} onChange={(e) => setName(e)} placeholder="Enter report name" required />
        <Input label="Description" value={description} onChange={(e) => setDescription(e)} placeholder="Brief description" />
        <Dropdown label="Chart Type" options={chartTypes} value={chartType} onChange={(v: ChartType) => setChartType(v)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button type="submit" variant="primary" loading={loading} disabled={!name.trim()}>Generate Report</Button>
        </div>
      </form>
    </Card>
  );
}
