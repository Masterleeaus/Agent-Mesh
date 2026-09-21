import { useState, type FC, type FormEvent } from 'react';
import { Card, Form, Button, Input, Dropdown, Skeleton } from '@resqai/foundation';
import type { DropdownOption } from '@resqai/foundation';

interface QueueSettings {
  queueName: string;
  defaultUrgency: string;
  autoAssignEnabled: boolean;
  slaThreshold: string;
  maxTicketsPerAgent: string;
}

const urgencyOptions: DropdownOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1a2744' };

export const QueueSettingsPage: FC = () => {
  const [settings, setSettings] = useState<QueueSettings>({
    queueName: 'Support Queue',
    defaultUrgency: 'normal',
    autoAssignEnabled: true,
    slaThreshold: '4',
    maxTicketsPerAgent: '25',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    setSaved(false);
    await new Promise(r => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Queue Settings</h1>
        <Card variant="elevated"><Skeleton variant="rectangular" height={300} /></Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Queue Settings</h1>

      <Card variant="elevated" role="region" aria-label="Queue settings form">
        <Form onSubmit={handleSubmit} layout="vertical">
          <div>
            <div style={rowStyle}>
              <div><span style={{ fontSize: 13, fontWeight: 500, color: '#e6ecf5' }}>Queue Name</span><p style={{ margin: '2px 0 0', fontSize: 11, color: '#8b9bb5' }}>Display name for this queue</p></div>
              <div style={{ width: 240 }}>
                <Input value={settings.queueName} onChange={e => setSettings(s => ({ ...s, queueName: e.target.value }))} />
              </div>
            </div>

            <div style={rowStyle}>
              <div><span style={{ fontSize: 13, fontWeight: 500, color: '#e6ecf5' }}>Default Urgency</span><p style={{ margin: '2px 0 0', fontSize: 11, color: '#8b9bb5' }}>Default urgency for new tickets</p></div>
              <div style={{ width: 240 }}>
                <Dropdown options={urgencyOptions} value={settings.defaultUrgency} onChange={v => setSettings(s => ({ ...s, defaultUrgency: v as string }))} />
              </div>
            </div>

            <div style={rowStyle}>
              <div><span style={{ fontSize: 13, fontWeight: 500, color: '#e6ecf5' }}>SLA Threshold (hrs)</span><p style={{ margin: '2px 0 0', fontSize: 11, color: '#8b9bb5' }}>Time before SLA breach</p></div>
              <div style={{ width: 240 }}>
                <Input value={settings.slaThreshold} onChange={e => setSettings(s => ({ ...s, slaThreshold: e.target.value }))} type="number" />
              </div>
            </div>

            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <div><span style={{ fontSize: 13, fontWeight: 500, color: '#e6ecf5' }}>Max Tickets Per Agent</span><p style={{ margin: '2px 0 0', fontSize: 11, color: '#8b9bb5' }}>Capacity limit per agent</p></div>
              <div style={{ width: 240 }}>
                <Input value={settings.maxTicketsPerAgent} onChange={e => setSettings(s => ({ ...s, maxTicketsPerAgent: e.target.value }))} type="number" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #1a2744' }}>
            {saved && <span style={{ fontSize: 12, color: '#4ade80', alignSelf: 'center' }}>Settings saved</span>}
            <Button type="submit" loading={saving}>Save Settings</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};
