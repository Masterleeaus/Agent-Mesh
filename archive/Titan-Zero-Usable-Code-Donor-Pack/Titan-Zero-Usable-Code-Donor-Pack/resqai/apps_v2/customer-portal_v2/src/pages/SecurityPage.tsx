import { useState } from 'react';
import { useSecuritySettings } from '../hooks/useSecuritySettings';
import { Card, Button, Skeleton, ErrorState, EmptyState } from '../../../shared/src/components';
import { ChangePasswordForm } from '../components/forms/ChangePasswordForm';

export function SecurityPage() {
  const { settings, loading, error, toggleTwoFactor, revokeSession } = useSecuritySettings();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton variant="rectangular" height={40} width={200} />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load security settings" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Security</h1>
      </div>

      {!showChangePassword ? (
        <>
          <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Password</span>}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: '#e6ecf5' }}>Password</div>
                {settings && (
                  <div style={{ fontSize: 11, color: '#6b7b95', marginTop: 2 }}>Last changed: {new Date(settings.lastPasswordChange).toLocaleDateString()}</div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowChangePassword(true)}>Change Password</Button>
            </div>
          </Card>

          <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Two-Factor Authentication</span>}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: '#e6ecf5' }}>Two-factor authentication adds an extra layer of security.</div>
                <div style={{ fontSize: 12, color: settings?.twoFactorEnabled ? '#41d1c4' : '#8b9bb5', marginTop: 4 }}>
                  {settings?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <Button variant={settings?.twoFactorEnabled ? 'outline' : 'primary'} size="sm"
                onClick={() => toggleTwoFactor({ enable: !settings?.twoFactorEnabled, phone: '+1-555-0001' })}>
                {settings?.twoFactorEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </Card>

          <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Active Sessions</span>}>
            {settings && settings.activeSessions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {settings.activeSessions.map((session) => (
                  <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a2744' }}>
                    <div>
                      <div style={{ fontSize: 13, color: session.current ? '#41d1c4' : '#e6ecf5', fontWeight: session.current ? 600 : 400 }}>
                        {session.deviceName} {session.current && '(Current)'}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7b95' }}>{session.ipAddress} · Last active: {new Date(session.lastActive).toLocaleString()}</div>
                    </div>
                    {!session.current && (
                      <Button variant="ghost" size="sm" onClick={() => revokeSession(session.id)}>Revoke</Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No active sessions" size="sm" />
            )}
          </Card>
        </>
      ) : passwordChanged ? (
        <Card padding="md" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h3 style={{ color: '#e6ecf5', fontSize: 16, margin: '0 0 8px' }}>Password Changed Successfully</h3>
          <p style={{ color: '#8b9bb5', fontSize: 13, margin: '0 0 16px' }}>Your password has been updated.</p>
          <Button variant="primary" onClick={() => { setShowChangePassword(false); setPasswordChanged(false); }}>Done</Button>
        </Card>
      ) : (
        <ChangePasswordForm onSuccess={() => setPasswordChanged(true)} onCancel={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}