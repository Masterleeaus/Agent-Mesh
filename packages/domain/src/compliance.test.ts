import { describe, expect, it } from "vitest";
import { assessRequirement, planComplianceRemediation } from "./compliance";

const context = { company_id: "a", actor_id: "reviewer", correlation_id: "corr", idempotency_key: "idem" };
const requirement = { company_id: "a", requirement_id: "white-card", responsible_party_id: "worker", expires_at: null };

describe("compliance evidence projections", () => {
  it("distinguishes immutable verified evidence from missing evidence", () => {
    expect(assessRequirement(context, requirement, [], "2026-09-29T00:00:00Z")).toBe("MISSING");
    expect(assessRequirement(context, requirement, [{ company_id: "a", evidence_id: "e1", requirement_id: "white-card", immutable: false, verified: true, captured_at: "2026-09-01", expires_at: null }], "2026-09-29T00:00:00Z")).toBe("UNVERIFIED");
  });
  it("detects expiry and plans review-gated remediation", () => {
    const assessment = assessRequirement(context, { ...requirement, expires_at: "2026-10-01T00:00:00Z" }, [{ company_id: "a", evidence_id: "e1", requirement_id: "white-card", immutable: true, verified: true, captured_at: "2026-09-01", expires_at: "2026-10-01T00:00:00Z" }], "2026-09-29T00:00:00Z");
    expect(assessment).toBe("EXPIRING");
    expect(planComplianceRemediation(context, requirement, assessment)).toMatchObject({ kind: "REVIEW_REQUIRED", requirement_id: "white-card", idempotency_key: "idem" });
  });
  it("fails closed on company mismatch and does not remediate satisfied requirements", () => {
    expect(() => assessRequirement(context, { ...requirement, company_id: "b" }, [], "2026-09-29T00:00:00Z")).toThrow("compliance_company_mismatch");
    expect(planComplianceRemediation(context, requirement, "SATISFIED")).toBeNull();
  });
});

