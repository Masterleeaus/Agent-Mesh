export interface TenantSmsSettings {
  enabled: boolean;
  simNumber?: number;
  /** Optional tenant-bound webhook credential. Never expose this value to clients/logs. */
  webhookKey?: string;
}

function settingsObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      // MySQL drivers may return JSON as strings; malformed settings fall back safely.
    }
  }
  return {};
}

export function resolveTenantSmsSettings(value: unknown): TenantSmsSettings {
  const settings = settingsObject(value);
  const rawSim = settings.sms_sim_number;
  const simNumber = typeof rawSim === "number" && Number.isInteger(rawSim) && rawSim > 0 ? rawSim : undefined;
  const rawWebhookKey = settings.sms_webhook_key;
  const webhookKey = typeof rawWebhookKey === "string" && rawWebhookKey.trim() ? rawWebhookKey.trim() : undefined;
  return {
    enabled: settings.sms_enabled !== false,
    simNumber,
    webhookKey,
  };
}
