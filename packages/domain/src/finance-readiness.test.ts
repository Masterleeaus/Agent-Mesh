import { describe, expect, it } from "vitest";
import { canMarkFinanceVerified, normalizeFinanceEvidence } from "./finance-readiness";

const base = { company_id: "company-a", record_id: "payment-1", kind: "payment" as const, correlation_id: "journey-1", idempotency_key: "provider:event-1", currency: "aud", amount_minor: 1250, provider: "square", provider_ref: "sq-payment-1", source_evidence_ref: "evidence-1", provider_reread_ref: "reread-1", verified: true };

describe("finance evidence readiness", () => {
  it("normalizes provider-backed money and preserves provenance", () => expect(normalizeFinanceEvidence(base)).toMatchObject({ currency: "AUD", provider_ref: "sq-payment-1", source_evidence_ref: "evidence-1" }));
  it("rejects verified records without provider reread", () => expect(() => normalizeFinanceEvidence({ ...base, provider_reread_ref: undefined })).toThrow(/reread/));
  it("keeps verification company-scoped", () => { expect(canMarkFinanceVerified(base, "company-a")).toBe(true); expect(canMarkFinanceVerified(base, "company-b")).toBe(false); });
});

