import { describe, expect, it } from "vitest";
import { resolveTenantSmsSettings, tenantSmsWebhookKeyMatches } from "../settings";

describe("resolveTenantSmsSettings", () => {
  it("defaults SMS on while preserving environment-backed gateway credentials", () => {
    expect(resolveTenantSmsSettings({})).toEqual({
      enabled: true,
      simNumber: undefined,
      webhookKey: undefined,
      gatewayUrl: undefined,
      gatewayUsername: undefined,
      gatewayPassword: undefined,
      quietHours: undefined,
    });
  });

  it("respects tenant disable and portable JSON-string settings", () => {
    expect(resolveTenantSmsSettings('{"sms_enabled":false,"sms_sim_number":2}')).toEqual({
      enabled: false,
      simNumber: 2,
      webhookKey: undefined,
      gatewayUrl: undefined,
      gatewayUsername: undefined,
      gatewayPassword: undefined,
      quietHours: undefined,
    });
  });

  it("rejects invalid SIM values", () => {
    expect(resolveTenantSmsSettings({ sms_enabled: true, sms_sim_number: -1 })).toEqual({
      enabled: true,
      simNumber: undefined,
      webhookKey: undefined,
    });
  });
  it("resolves and trims the tenant quiet-hours timezone", () => {
    expect(resolveTenantSmsSettings({
      sms_quiet_hours_start: 21,
      sms_quiet_hours_end: 7,
      sms_quiet_hours_timezone: "  Australia/Melbourne  ",
    })).toMatchObject({
      quietHours: { startHour: 21, endHour: 7 },
      quietHoursTimeZone: "Australia/Melbourne",
    });
  });

  it("does not invent a quiet-hours timezone", () => {
    expect(resolveTenantSmsSettings({
      sms_quiet_hours_start: 21,
      sms_quiet_hours_end: 7,
    }).quietHoursTimeZone).toBeUndefined();
  });

  it("resolves a valid tenant quiet-hours window", () => {
    expect(resolveTenantSmsSettings({
      sms_quiet_hours_start: 21,
      sms_quiet_hours_end: 7,
    })).toMatchObject({
      quietHours: { startHour: 21, endHour: 7 },
    });
  });

  it("fails closed to no configured window for invalid or incomplete quiet-hours settings", () => {
    expect(resolveTenantSmsSettings({ sms_quiet_hours_start: 21 }).quietHours).toBeUndefined();
    expect(resolveTenantSmsSettings({ sms_quiet_hours_start: -1, sms_quiet_hours_end: 7 }).quietHours).toBeUndefined();
    expect(resolveTenantSmsSettings({ sms_quiet_hours_start: 21, sms_quiet_hours_end: 24 }).quietHours).toBeUndefined();
    expect(resolveTenantSmsSettings({ sms_quiet_hours_start: "21", sms_quiet_hours_end: 7 }).quietHours).toBeUndefined();
  });

  it("resolves tenant gateway credentials without exposing deployment-global values", () => {
    expect(resolveTenantSmsSettings({
      sms_gateway_url: "  https://gateway.example.test  ",
      sms_gateway_username: " tenant-user ",
      sms_gateway_password: " tenant-password ",
      sms_sim_number: 3,
    })).toMatchObject({
      gatewayUrl: "https://gateway.example.test",
      gatewayUsername: "tenant-user",
      gatewayPassword: "tenant-password",
      simNumber: 3,
    });
  });

  it("does not synthesize tenant gateway credentials when settings are absent", () => {
    const settings = resolveTenantSmsSettings({});
    expect(settings.gatewayUrl).toBeUndefined();
    expect(settings.gatewayUsername).toBeUndefined();
    expect(settings.gatewayPassword).toBeUndefined();
  });

  it("resolves and trims a tenant webhook credential", () => {
    expect(resolveTenantSmsSettings({ sms_webhook_key: "  tenant-secret  " })).toMatchObject({
      webhookKey: "tenant-secret",
    });
  });

  it("fails closed when a webhook credential is absent", () => {
    expect(tenantSmsWebhookKeyMatches(resolveTenantSmsSettings({}), "shared-key")).toBe(false);
    expect(tenantSmsWebhookKeyMatches(resolveTenantSmsSettings({ sms_webhook_key: "tenant-a" }), null)).toBe(false);
  });

  it("accepts only the credential configured for that tenant", () => {
    const tenantA = resolveTenantSmsSettings({ sms_webhook_key: "tenant-a-secret" });
    const tenantB = resolveTenantSmsSettings({ sms_webhook_key: "tenant-b-secret" });
    expect(tenantSmsWebhookKeyMatches(tenantA, "tenant-a-secret")).toBe(true);
    expect(tenantSmsWebhookKeyMatches(tenantA, "tenant-b-secret")).toBe(false);
    expect(tenantSmsWebhookKeyMatches(tenantB, "tenant-a-secret")).toBe(false);
  });

  it("rejects same-prefix credentials with different lengths or bytes", () => {
    const settings = resolveTenantSmsSettings({ sms_webhook_key: "tenant-secret" });
    expect(tenantSmsWebhookKeyMatches(settings, "tenant-secret-extra")).toBe(false);
    expect(tenantSmsWebhookKeyMatches(settings, "tenant-secrex")).toBe(false);
  });
});
