import { useState } from 'react';
import { Card, Dropdown, Button } from '../../../../shared/src/components';
import type { DateRangePreset } from '../models/dto';

interface FilterAnalyticsFormProps {
  onApply: (filters: { dateRange: DateRangePreset; domain: string }) => void;
  loading?: boolean;
  initialDomain?: string;
  initialDateRange?: DateRangePreset;
}

const dateRanges: Array<{ value: DateRangePreset; label: string }> = [
  { value: 'today' as DateRangePreset, label: 'Today' },
  { value: 'yesterday' as DateRangePreset, label: 'Yesterday' },
  { value: 'last7Days' as DateRangePreset, label: 'Last 7 Days' },
  { value: 'last30Days' as DateRangePreset, label: 'Last 30 Days' },
  { value: 'last90Days' as DateRangePreset, label: 'Last 90 Days' },
  { value: 'thisMonth' as DateRangePreset, label: 'This Month' },
  { value: 'lastMonth' as DateRangePreset, label: 'Last Month' },
  { value: 'thisQuarter' as DateRangePreset, label: 'This Quarter' },
  { value: 'thisYear' as DateRangePreset, label: 'This Year' },
  { value: 'custom' as DateRangePreset, label: 'Custom Range' },
];

const domains = [
  { value: 'all', label: 'All Domains' },
  { value: 'support', label: 'Support' },
  { value: 'operations', label: 'Operations' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'technicians', label: 'Technicians' },
  { value: 'customers', label: 'Customers' },
  { value: 'crm', label: 'CRM' },
];

export function FilterAnalyticsForm({ onApply, loading, initialDomain = 'all', initialDateRange = 'last30Days' as DateRangePreset }: FilterAnalyticsFormProps) {
  const [dateRange, setDateRange] = useState<DateRangePreset>(initialDateRange);
  const [domain, setDomain] = useState(initialDomain);

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16 }}>Filter Analytics</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 180 }}>
          <Dropdown label="Date Range" options={dateRanges} value={dateRange} onChange={(v: DateRangePreset) => setDateRange(v)} />
        </div>
        <div style={{ minWidth: 160 }}>
          <Dropdown label="Domain" options={domains} value={domain} onChange={(v: string) => setDomain(v)} />
        </div>
        <Button variant="primary" size="sm" onClick={() => onApply({ dateRange, domain })} loading={loading}>Apply Filters</Button>
      </div>
    </Card>
  );
}
