import { useState, useEffect, type FC } from 'react';
import { Card, Button, Skeleton, ErrorState } from '@resqai/foundation';
import { technicianService } from '../services/technician-service';
import { useAppContext } from '../state/AppContext';

export const SettingsPage: FC = () => {
  const { addNotification, networkStatus } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    autoAcceptJobs: false,
    defaultView: 'list' as const,
    language: 'en',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await technicianService.getSettings();
        setSettings(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await technicianService.updateSettings(settings);
      addNotification({ type: 'success', title: 'Settings saved', message: 'Your settings have been updated.' });
    } catch {
      addNotification({ type: 'error', title: 'Failed to save', message: 'Could not save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={400} /></div>;
  if (error) return <div style={{ padding: 24 }}><ErrorState title="Failed to load settings" message={error} /></div>;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Settings</h1>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 16px' }}>Notifications</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 13, color: '#e6ecf5' }}>Push Notifications</span>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#8b9bb5' }}>Receive job alerts and messages</p>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={e => setSettings(s => ({ ...s, notificationsEnabled: e.target.checked }))}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: 24, transition: '0.3s',
              background: settings.notificationsEnabled ? '#41d1c4' : '#243049',
            }}>
              <span style={{
                position: 'absolute', height: 18, width: 18, left: 3, bottom: 3,
                borderRadius: '50%', background: '#fff', transition: '0.3s',
                transform: settings.notificationsEnabled ? 'translateX(20px)' : '',
              }} />
            </span>
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 13, color: '#e6ecf5' }}>Auto-accept Jobs</span>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#8b9bb5' }}>Automatically accept assigned jobs</p>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
            <input
              type="checkbox"
              checked={settings.autoAcceptJobs}
              onChange={e => setSettings(s => ({ ...s, autoAcceptJobs: e.target.checked }))}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: 24, transition: '0.3s',
              background: settings.autoAcceptJobs ? '#41d1c4' : '#243049',
            }}>
              <span style={{
                position: 'absolute', height: 18, width: 18, left: 3, bottom: 3,
                borderRadius: '50%', background: '#fff', transition: '0.3s',
                transform: settings.autoAcceptJobs ? 'translateX(20px)' : '',
              }} />
            </span>
          </label>
        </div>
      </Card>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 16px' }}>Display</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Default View</label>
          <select
            value={settings.defaultView}
            onChange={e => setSettings(s => ({ ...s, defaultView: e.target.value as 'list' | 'calendar' }))}
            style={{
              width: '100%', padding: '8px 12px', background: '#131c2f', color: '#e6ecf5',
              border: '1px solid #243049', borderRadius: 6, fontSize: 13,
            }}
          >
            <option value="list">List View</option>
            <option value="calendar">Calendar View</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Language</label>
          <select
            value={settings.language}
            onChange={e => setSettings(s => ({ ...s, language: e.target.value }))}
            style={{
              width: '100%', padding: '8px 12px', background: '#131c2f', color: '#e6ecf5',
              border: '1px solid #243049', borderRadius: 6, fontSize: 13,
            }}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </Card>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 16px' }}>Sync Status</h3>
        <p style={{ fontSize: 13, color: '#8b9bb5', margin: 0 }}>
          Network: <span style={{ color: networkStatus === 'online' ? '#4ecdc4' : '#ff6b6b' }}>{networkStatus}</span>
        </p>
      </Card>

      <Button onClick={handleSave} disabled={saving} loading={saving}>Save Settings</Button>
    </div>
  );
};
