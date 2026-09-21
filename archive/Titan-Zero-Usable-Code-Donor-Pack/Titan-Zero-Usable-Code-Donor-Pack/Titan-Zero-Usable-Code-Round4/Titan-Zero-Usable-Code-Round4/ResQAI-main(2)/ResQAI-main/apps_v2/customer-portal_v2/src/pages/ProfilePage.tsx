import { useEffect, useState } from 'react';
import { useCustomerProfile } from '../hooks/useCustomerProfile';
import { Card, Skeleton, ErrorState } from '../../../shared/src/components';
import { UpdateProfileForm } from '../components/forms/UpdateProfileForm';
import { NotificationPreferences } from '../components/NotificationPreferences';
import type { NotificationPreferenceDTO } from '../models/dto';

export function ProfilePage() {
  const { profile, preferences, loading, saving, error, updateProfile, updatePreferences } = useCustomerProfile();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferenceDTO | null>(null);

  useEffect(() => {
    if (preferences) setLocalPreferences({ ...preferences });
  }, [preferences]);

  const handlePreferenceChange = (key: keyof NotificationPreferenceDTO, value: boolean) => {
    if (!localPreferences) return;
    const updated = { ...localPreferences, [key]: value };
    setLocalPreferences(updated);
    updatePreferences(updated);
  };

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
    return <ErrorState title="Failed to load profile" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>My Profile</h1>

      {profile && <UpdateProfileForm profile={profile} saving={saving} onSave={updateProfile} />}
      {localPreferences && <NotificationPreferences preferences={localPreferences} onChange={handlePreferenceChange} />}

      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Password & Security</span>
            <div style={{ fontSize: 12, color: '#8b9bb5', marginTop: 4 }}>Manage your password and security settings.</div>
          </div>
          <button onClick={() => { window.location.hash = '/security'; }}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #243049', background: 'transparent', color: '#e6ecf5', cursor: 'pointer', fontSize: 13 }}>
            Manage
          </button>
        </div>
      </Card>
    </div>
  );
}