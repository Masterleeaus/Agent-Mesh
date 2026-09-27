import { describe, expect, it } from "vitest";
import { resolveTenantSmsSettings } from "../settings";

describe("resolveTenantSmsSettings", () => {
  it("defaults SMS on while preserving environment-backed gateway credentials", () => {
    expect(resolveTenantSmsSettings({})).toEqual({ enabled: true, simNumber: undefined });
  });

  it("respects tenant disable and portable JSON-string settings", () => {
    expect(resolveTenantSmsSettings('{"sms_enabled":false,"sms_sim_number":2}')).toEqual({
      enabled: false,
      simNumber: 2,
    });
  });

  it("rejects invalid SIM values", () => {
    expect(resolveTenantSmsSettings({ sms_enabled: true, sms_sim_number: -1 })).toEqual({
      enabled: true,
      simNumber: undefined,
    });
  });
});
