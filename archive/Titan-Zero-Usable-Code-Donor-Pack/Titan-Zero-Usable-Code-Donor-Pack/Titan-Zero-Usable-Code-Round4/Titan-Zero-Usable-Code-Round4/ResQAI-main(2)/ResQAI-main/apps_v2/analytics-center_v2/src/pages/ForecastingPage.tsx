import { useState } from 'react';
import { useForecasting } from '../hooks/useForecasting';
import { AreaChart, DataFreshnessIndicator } from '../components';
import { Card, Dropdown, ErrorState } from '../../../../shared/src/components';
import type { TimeSeriesDataPointVM } from '../models/view-models';

const metricOptions = [
  { value: 'tickets', label: 'Ticket Volume' },
  { value: 'appointments', label: 'Appointment Volume' },
  { value: 'resolutions', label: 'Resolution Volume' },
  { value: 'satisfaction', label: 'Customer Satisfaction' },
];

export function ForecastingPage() {
  const [metric, setMetric] = useState<string>('tickets');
  const { data, loading, error, refetch } = useForecasting(metric, 3);

  if (error) return <ErrorState title="Failed to load" message={error} onRetry={refetch} />;

  const forecastPoints: TimeSeriesDataPointVM[] = (data || []).map((f) => ({
    date: f.forecastDate, value: f.predictedValue, label: f.forecastDate,
  }));

  const upperPoints: TimeSeriesDataPointVM[] = (data || []).map((f) => ({
    date: f.forecastDate, value: f.upperBound,
  }));

  const lowerPoints: TimeSeriesDataPointVM[] = (data || []).map((f) => ({
    date: f.forecastDate, value: f.lowerBound,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Forecasting</h1>
        <DataFreshnessIndicator lastUpdated={new Date().toISOString()} loading={loading} />
      </div>

      <div style={{ marginBottom: 16, maxWidth: 240 }}>
        <Dropdown
          label="Select Metric"
          options={metricOptions}
          value={metric}
          onChange={(v: string) => setMetric(v)}
        />
      </div>

      <AreaChart data={forecastPoints} title={`${metricOptions.find((m) => m.value === metric)?.label || metric} Forecast`} loading={loading} height={300} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
        {(data || []).map((f, i) => (
          <Card key={i} padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
            <div style={{ fontSize: 12, color: '#8b9bb5', marginBottom: 4 }}>{f.forecastDate}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5' }}>{f.predictedValue.toFixed(1)}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: '#6b7a95' }}>
              <span>Low: {f.lowerBound.toFixed(1)}</span>
              <span>High: {f.upperBound.toFixed(1)}</span>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: f.confidence > 80 ? '#22c55e' : f.confidence > 70 ? '#f59e0b' : '#ef4444' }} />
              <span style={{ fontSize: 12, color: '#8b9bb5' }}>{f.confidence}% confidence</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
