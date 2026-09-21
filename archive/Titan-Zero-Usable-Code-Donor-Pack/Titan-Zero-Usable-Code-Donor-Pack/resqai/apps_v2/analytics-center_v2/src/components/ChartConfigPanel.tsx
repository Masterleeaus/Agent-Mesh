import { Card, Dropdown, Button, Form } from '../../../../shared/src/components';
import type { ChartType } from '../models/dto';

interface ChartConfigPanelProps {
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  title: string;
  onTitleChange: (title: string) => void;
  onApply?: () => void;
  onReset?: () => void;
}

const chartTypes: Array<{ value: ChartType; label: string }> = [
  { value: 'line' as ChartType, label: 'Line Chart' },
  { value: 'area' as ChartType, label: 'Area Chart' },
  { value: 'bar' as ChartType, label: 'Bar Chart' },
  { value: 'pie' as ChartType, label: 'Pie Chart' },
  { value: 'doughnut' as ChartType, label: 'Doughnut Chart' },
  { value: 'horizontalBar' as ChartType, label: 'Horizontal Bar' },
  { value: 'scatter' as ChartType, label: 'Scatter Plot' },
];

export function ChartConfigPanel({ chartType, onChartTypeChange, title, onTitleChange, onApply, onReset }: ChartConfigPanelProps) {
  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16 }}>Chart Configuration</div>
      <Form spacing="compact" layout="vertical">
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8b9bb5', marginBottom: 4 }}>Chart Title</label>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter chart title"
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#0b1220',
              border: '1px solid #243049',
              borderRadius: 6,
              color: '#e6ecf5',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Dropdown
            options={chartTypes}
            value={chartType}
            onChange={(v: ChartType) => onChartTypeChange(v)}
            size="sm"
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="primary" size="sm" onClick={onApply}>Apply</Button>
          {onReset && <Button variant="ghost" size="sm" onClick={onReset}>Reset</Button>}
        </div>
      </Form>
    </Card>
  );
}
