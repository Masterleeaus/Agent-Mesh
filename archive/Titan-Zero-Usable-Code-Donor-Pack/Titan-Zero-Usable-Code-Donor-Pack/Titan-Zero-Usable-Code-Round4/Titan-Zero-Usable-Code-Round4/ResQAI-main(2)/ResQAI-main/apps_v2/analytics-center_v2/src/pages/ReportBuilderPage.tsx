import { useState } from 'react';
import { Card, Button, Dropdown, Form } from '../../../../shared/src/components';
import { ReportBuilderCanvas, ChartConfigPanel } from '../components';
import type { ChartType } from '../models/dto';

export function ReportBuilderPage() {
  const [reportName, setReportName] = useState('');
  const [chartType, setChartType] = useState<ChartType>('bar' as ChartType);
  const [chartTitle, setChartTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaving(false);
    } catch {
      setError('Failed to save report');
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Report Builder</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => { window.location.hash = '/reports'; }}>Cancel</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>Save Report</Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 6, color: '#ef4444', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Form spacing="compact" layout="vertical">
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#8b9bb5', marginBottom: 4 }}>Report Name</label>
              <input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
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
          </Form>
          <ReportBuilderCanvas>
            <div style={{ textAlign: 'center', color: '#6b7a95', padding: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#8b9bb5' }}>
                {chartTitle || 'Untitled Chart'}
              </div>
              <div style={{ fontSize: 13 }}>Configure your chart using the panel on the right.</div>
            </div>
          </ReportBuilderCanvas>
        </div>

        <ChartConfigPanel
          chartType={chartType}
          onChartTypeChange={setChartType}
          title={chartTitle}
          onTitleChange={setChartTitle}
          onApply={() => {}}
          onReset={() => { setChartTitle(''); setChartType('bar' as ChartType); }}
        />
      </div>
    </div>
  );
}
