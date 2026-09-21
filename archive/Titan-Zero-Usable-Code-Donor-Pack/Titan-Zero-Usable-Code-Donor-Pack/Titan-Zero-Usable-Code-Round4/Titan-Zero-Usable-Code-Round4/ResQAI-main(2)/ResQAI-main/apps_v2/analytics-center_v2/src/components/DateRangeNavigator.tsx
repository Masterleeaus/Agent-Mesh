import { Dropdown } from '../../../../shared/src/components';
import type { DateRangePreset } from '../models/dto';

interface DateRangeNavigatorProps {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
}

const presets: Array<{ value: DateRangePreset; label: string }> = [
  { value: 'today' as DateRangePreset, label: 'Today' },
  { value: 'yesterday' as DateRangePreset, label: 'Yesterday' },
  { value: 'last7Days' as DateRangePreset, label: 'Last 7 Days' },
  { value: 'last30Days' as DateRangePreset, label: 'Last 30 Days' },
  { value: 'last90Days' as DateRangePreset, label: 'Last 90 Days' },
  { value: 'thisMonth' as DateRangePreset, label: 'This Month' },
  { value: 'lastMonth' as DateRangePreset, label: 'Last Month' },
  { value: 'thisQuarter' as DateRangePreset, label: 'This Quarter' },
  { value: 'lastQuarter' as DateRangePreset, label: 'Last Quarter' },
  { value: 'thisYear' as DateRangePreset, label: 'This Year' },
  { value: 'custom' as DateRangePreset, label: 'Custom Range' },
];

export function DateRangeNavigator({ value, onChange }: DateRangeNavigatorProps) {
  return (
    <Dropdown
      options={presets}
      value={value}
      onChange={(v: DateRangePreset) => onChange(v)}
      size="sm"
    />
  );
}
