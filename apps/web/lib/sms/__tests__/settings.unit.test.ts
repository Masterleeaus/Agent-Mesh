import { describe, expect, it } from "vitest";
import { resolveTenantSmsSettings, tenantSmsWebhookKeyMatches } from "../settings";

describe("resolveTenantSmsSettings", () => {
  it("defaults SMS on while preserving environment-backed gateway credentials", () => {
    expect(resolveTenantSmsSettings({})).toEqual({ enabled: true, simNumber: undefined, webhookKey: undefined });
  });

  it("respects tenant disable and portable JSON-string settings", () => {
    expect(resolveTenantSmsSettings('{"sms_enabled":false,"sms_sim_number":2}')).toEqual({
      enabled: false,
      simNumber: 2,
      webhookKey: undefined,
    });
  });

  it("rejects invalid SIM values", () => {
    expect(resolveTenantSmsSettings({ sms_enabled: true, sms_sim_number: -1 })).toEqual({
      enabled: true,
      simNumber: undefined,
      webhookKey: undefined,
    });
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
