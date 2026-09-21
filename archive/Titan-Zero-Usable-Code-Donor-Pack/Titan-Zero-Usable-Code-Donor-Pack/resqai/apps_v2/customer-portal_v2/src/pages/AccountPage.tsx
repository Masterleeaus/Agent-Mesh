import { useEffect, useState } from 'react';
import { useCustomerProfile } from '../hooks/useCustomerProfile';
import { Card, Skeleton, ErrorState } from '../../../shared/src/components';
import { ProfileEditor } from '../components/ProfileEditor';
import { NotificationPreferences } from '../components/NotificationPreferences';
import type { NotificationPreferenceDTO } from '../models/dto';

export function AccountPage() {
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
    return <ErrorState title="Failed to load account" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Account Settings</h1>

      {profile && <ProfileEditor profile={profile} saving={saving} onSave={updateProfile} />}
      {localPreferences && <NotificationPreferences preferences={localPreferences} onChange={handlePreferenceChange} />}
    </div>
  );
}
