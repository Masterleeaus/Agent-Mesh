import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { ProfileVM } from '../models/view-models';
import type { UpdateProfileRequest } from '../models/api-requests';
import type { NotificationPreferenceDTO } from '../models/dto';
import type { UpdateNotificationPreferencesRequest } from '../models/api-requests';

interface UseCustomerProfileResult {
  profile: ProfileVM | null;
  preferences: NotificationPreferenceDTO | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateProfile: (req: UpdateProfileRequest) => Promise<void>;
  updatePreferences: (req: UpdateNotificationPreferencesRequest) => Promise<void>;
}

export function useCustomerProfile(): UseCustomerProfileResult {
  const [profile, setProfile] = useState<ProfileVM | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferenceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([CustomerService.getProfile(), CustomerService.getNotificationPreferences()])
      .then(([p, pref]) => { if (!cancelled) { setProfile(p); setPreferences(pref); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load profile'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const updateProfile = useCallback(async (req: UpdateProfileRequest) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await CustomerService.updateProfile(req);
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const updatePreferences = useCallback(async (req: UpdateNotificationPreferencesRequest) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await CustomerService.updateNotificationPreferences(req);
      setPreferences(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { profile, preferences, loading, saving, error, updateProfile, updatePreferences };
}
