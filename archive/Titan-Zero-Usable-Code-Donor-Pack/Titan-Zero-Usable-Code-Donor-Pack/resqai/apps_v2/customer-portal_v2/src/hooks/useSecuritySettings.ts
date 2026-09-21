import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { SecuritySettingDTO } from '../models/dto';
import type { EnableTwoFactorRequest } from '../models/api-requests';

interface UseSecuritySettingsResult {
  settings: SecuritySettingDTO | null;
  loading: boolean;
  error: string | null;
  toggleTwoFactor: (req: EnableTwoFactorRequest) => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
}

export function useSecuritySettings(): UseSecuritySettingsResult {
  const [settings, setSettings] = useState<SecuritySettingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    CustomerService.getSecuritySettings()
      .then((result) => { if (!cancelled) setSettings(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load security settings'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toggleTwoFactor = useCallback(async (req: EnableTwoFactorRequest) => {
    await CustomerService.enableTwoFactor(req);
    setSettings((prev) => prev ? { ...prev, twoFactorEnabled: req.enable } : prev);
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    await CustomerService.revokeSession(sessionId);
    setSettings((prev) => prev ? { ...prev, activeSessions: prev.activeSessions.filter((s) => s.id !== sessionId) } : prev);
  }, []);

  return { settings, loading, error, toggleTwoFactor, revokeSession };
}