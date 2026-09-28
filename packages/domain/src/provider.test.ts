import { describe, expect, it } from "vitest";
import { assertConnectionCredential, assertProviderManifest, planProviderReconciliation, validateWebhook } from "./provider";

const connection = { company_id: "a", connection_id: "conn", provider_id: "xero", credential_ref: "cred-a", schema_version: "v1", cursor: "c1", status: "ACTIVE" as const };

describe("provider boundary contracts", () => {
  it("requires capability-bearing manifests and opaque active credentials", () => {
    expect(() => assertProviderManifest({ provider_id: "xero", version: "1", profiles: ["ACCOUNTING"], capability_ids: ["finance.invoice"], auth_mechanisms: ["oauth"], scopes: [], credential_ref_required: true })).not.toThrow();
    expect(() => assertConnectionCredential({ ...connection, credential_ref: null })).toThrow("provider_active_credential_required");
  });
  it("rejects unauthenticated or replayed webhooks", () => {
    expect(() => validateWebhook({ company_id: "a", connection_id: "conn", provider_id: "xero", provider_event_id: "e", idempotency_key: "i", signature_valid: false, replayed: false, payload_ref: "blob" })).toThrow("signature_invalid");
    expect(() => validateWebhook({ company_id: "a", connection_id: "conn", provider_id: "xero", provider_event_id: "e", idempotency_key: "i", signature_valid: true, replayed: true, payload_ref: "blob" })).toThrow("provider_webhook_replay");
  });
  it("reconciles cursors while failing closed on company or schema drift", () => {
    expect(planProviderReconciliation(connection, { ...connection })).toEqual({ kind: "NOOP", cursor: "c1" });
    expect(planProviderReconciliation(connection, { ...connection, cursor: "c2" })).toEqual({ kind: "APPLY", expected_cursor: "c1", observed_cursor: "c2" });
    expect(planProviderReconciliation(connection, { ...connection, company_id: "b" })).toEqual({ kind: "CONFLICT", reason: "COMPANY_MISMATCH" });
  });
});

