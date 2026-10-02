import { describe, expect, it } from "vitest";
import { canMarkFinanceVerified, normalizeFinanceEvidence } from "./finance-readiness";

const base = { company_id: "company-a", record_id: "payment-1", kind: "payment" as const, correlation_id: "journey-1", idempotency_key: "provider:event-1", currency: "aud", amount_minor: 1250, provider: "square", provider_ref: "sq-payment-1", source_evidence_ref: "evidence-1", provider_reread_ref: "reread-1", verified: true };

describe("finance evidence readiness", () => {
  it.each(["AUD", "aud", "aUd"])("normalizes %s without changing provenance or the input", (currency) => {
    const record = { ...base, currency };
    const result = normalizeFinanceEvidence(record);

    expect(result).toEqual({ ...record, currency: "AUD" });
    expect(result).not.toBe(record);
    expect(record.currency).toBe(currency);
  });

  it.each(["", "AU", "AUDD", " AUD", "AUD ", "AUD\n", "A\nD", "AU1", "A-D", "ＡＵＤ", "аud", "uſd"])("rejects malformed currency %j", (currency) => {
    expect(() => normalizeFinanceEvidence({ ...base, currency })).toThrow(/ISO currency/);
  });

  it.each([undefined, null, 123, true, ["AUD"], { toString: () => "AUD", toUpperCase: () => "AUD" }])("rejects non-string currency %j", (currency) => {
    expect(() => normalizeFinanceEvidence({ ...base, currency: currency as unknown as string })).toThrow(/ISO currency/);
  });

  it.each([0, Number.MAX_SAFE_INTEGER])("preserves valid minor-unit amount %s", (amount_minor) => {
    expect(normalizeFinanceEvidence({ ...base, amount_minor }).amount_minor).toBe(amount_minor);
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, -Infinity, "1250", null, undefined])("rejects invalid minor-unit amount %s", (amount_minor) => {
    expect(() => normalizeFinanceEvidence({ ...base, amount_minor: amount_minor as unknown as number })).toThrow(/non-negative minor-unit/);
  });

  it.each(["company_id", "record_id", "correlation_id", "idempotency_key"] as const)("requires %s", (field) => {
    expect(() => normalizeFinanceEvidence({ ...base, [field]: "" })).toThrow(/company, identity, correlation, and idempotency/);
  });

  it.each(["provider", "provider_ref", "source_evidence_ref"] as const)("requires provenance field %s", (field) => {
    expect(() => normalizeFinanceEvidence({ ...base, [field]: "" })).toThrow(/provenance/);
  });

  it("rejects verified records without provider reread", () => {
    expect(() => normalizeFinanceEvidence({ ...base, provider_reread_ref: undefined })).toThrow(/reread/);
  });

  it("keeps provider acknowledgement unverified without a reread", () => {
    const acknowledgement = { ...base, verified: false, provider_reread_ref: undefined };
    const result = normalizeFinanceEvidence(acknowledgement);

    expect(result).toEqual({ ...acknowledgement, currency: "AUD" });
    expect(canMarkFinanceVerified(result, "company-a")).toBe(false);
  });

  it("keeps verification company-scoped", () => {
    expect(canMarkFinanceVerified(base, "company-a")).toBe(true);
    expect(canMarkFinanceVerified(base, "company-b")).toBe(false);
  });

  it.each(["source_evidence_ref", "provider_reread_ref", "provider_ref"] as const)("blocks verification without %s", (field) => {
    expect(canMarkFinanceVerified({ ...base, [field]: "" }, "company-a")).toBe(false);
  });
});
