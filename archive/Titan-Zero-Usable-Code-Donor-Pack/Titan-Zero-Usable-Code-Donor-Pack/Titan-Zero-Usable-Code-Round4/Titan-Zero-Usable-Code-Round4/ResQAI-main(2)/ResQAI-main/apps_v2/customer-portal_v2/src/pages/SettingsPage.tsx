import { Card, Button } from '../../../shared/src/components';
import { useNavigate } from '../routes/useNavigate';

export function SettingsPage() {
  const navigate = useNavigate();

  const sections = [
    { title: 'Profile', description: 'Update your personal information and contact details.', route: '/profile', icon: '👤' },
    { title: 'Notifications', description: 'Configure how and when we notify you.', route: '/profile', icon: '🔔' },
    { title: 'Security', description: 'Password, two-factor authentication, and sessions.', route: '/security', icon: '🔒' },
    { title: 'Preferences', description: 'Language, timezone, and display settings.', route: '/settings', icon: '⚙️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Settings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {sections.map((s) => (
          <Card key={s.title} padding="md" clickable onClick={() => navigate(s.route)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>{s.title}</div>
                <div style={{ fontSize: 12, color: '#8b9bb5', marginTop: 2 }}>{s.description}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}