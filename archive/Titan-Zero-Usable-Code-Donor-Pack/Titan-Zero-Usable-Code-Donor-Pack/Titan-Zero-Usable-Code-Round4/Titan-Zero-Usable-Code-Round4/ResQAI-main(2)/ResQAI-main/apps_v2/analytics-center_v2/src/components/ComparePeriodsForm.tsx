import { useState } from 'react';
import { Card, Dropdown, Button } from '../../../../shared/src/components';

interface ComparePeriodsFormProps {
  onCompare: (periodA: string, periodB: string) => void;
  loading?: boolean;
}

const periodOptions = [
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
];

export function ComparePeriodsForm({ onCompare, loading }: ComparePeriodsFormProps) {
  const [periodA, setPeriodA] = useState('this_month');
  const [periodB, setPeriodB] = useState('last_month');

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16 }}>Compare Periods</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 150 }}>
          <Dropdown label="Period A" options={periodOptions} value={periodA} onChange={(v: string) => setPeriodA(v)} />
        </div>
        <div style={{ minWidth: 150 }}>
          <Dropdown label="Period B" options={periodOptions} value={periodB} onChange={(v: string) => setPeriodB(v)} />
        </div>
        <Button variant="primary" size="sm" onClick={() => onCompare(periodA, periodB)} loading={loading}>Compare</Button>
      </div>
    </Card>
  );
}
