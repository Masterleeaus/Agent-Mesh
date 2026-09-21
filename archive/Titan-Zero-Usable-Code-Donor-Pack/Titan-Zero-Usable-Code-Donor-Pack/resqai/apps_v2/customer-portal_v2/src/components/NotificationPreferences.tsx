import { Card, Form } from '../../../shared/src/components';
import type { NotificationPreferenceDTO } from '../models/dto';

interface NotificationPreferencesProps {
  preferences: NotificationPreferenceDTO;
  onChange: (key: keyof NotificationPreferenceDTO, value: boolean) => void;
}

export function NotificationPreferences({ preferences, onChange }: NotificationPreferencesProps) {
  const items: { key: keyof NotificationPreferenceDTO; label: string }[] = [
    { key: 'email', label: 'Email Notifications' },
    { key: 'sms', label: 'SMS Notifications' },
    { key: 'inApp', label: 'In-App Notifications' },
    { key: 'ticketUpdates', label: 'Ticket Updates' },
    { key: 'appointmentReminders', label: 'Appointment Reminders' },
    { key: 'promotional', label: 'Promotional Messages' },
  ];

  return (
    <Card padding="md">
      <span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 16, display: 'block' }}>Notification Preferences</span>
      <Form layout="vertical">
        {items.map((item) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a2744' }}>
            <span style={{ fontSize: 13, color: '#e6ecf5' }}>{item.label}</span>
            <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22 }}>
              <input type="checkbox" checked={!!preferences[item.key]} onChange={(e) => onChange(item.key, e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22,
                background: preferences[item.key] ? '#41d1c4' : '#243049', transition: '0.2s',
              }}>
                <span style={{
                  position: 'absolute', height: 18, width: 18, borderRadius: '50%', background: '#fff', top: 2,
                  left: preferences[item.key] ? 20 : 2, transition: '0.2s',
                }} />
              </span>
            </label>
          </div>
        ))}
      </Form>
    </Card>
  );
}
