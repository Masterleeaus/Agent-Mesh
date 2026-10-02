/** Compliance workforce projections over immutable evidence and policy-owned requirements. */

export type ComplianceContext = { company_id: string; actor_id: string; correlation_id: string; idempotency_key: string };
export type ComplianceRequirement = { company_id: string; requirement_id: string; responsible_party_id: string; expires_at: string | null };
export type EvidenceReference = { company_id: string; evidence_id: string; requirement_id: string; immutable: boolean; verified: boolean; captured_at: string; expires_at: string | null };
export type ComplianceAssessment = "SATISFIED" | "EXPIRING" | "EXPIRED" | "MISSING" | "UNVERIFIED";
export type RemediationPlan = { kind: "REVIEW_REQUIRED"; company_id: string; requirement_id: string; assessment: Exclude<ComplianceAssessment, "SATISFIED">; idempotency_key: string; correlation_id: string };

function required(value: string, name: string): void {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`compliance_${name}_required`);
}

export function assessRequirement(
  context: ComplianceContext,
  requirement: ComplianceRequirement,
  evidence: EvidenceReference[],
  now: string,
  expiryWarningDays = 30,
): ComplianceAssessment {
  required(context.company_id, "company_id");
  required(now, "now");
  if (requirement.company_id !== context.company_id) throw new Error("compliance_company_mismatch");
  const matching = evidence.filter(item => item.company_id === context.company_id && item.requirement_id === requirement.requirement_id);
  if (!matching.length) return "MISSING";
  const verified = matching.filter(item => item.immutable && item.verified);
  if (!verified.length) return "UNVERIFIED";
  const latestExpiry = verified.map(item => item.expires_at).filter((value): value is string => Boolean(value)).sort().at(-1) ?? requirement.expires_at;
  if (!latestExpiry) return "SATISFIED";
  const remainingDays = (Date.parse(latestExpiry) - Date.parse(now)) / 86_400_000;
  if (remainingDays < 0) return "EXPIRED";
  if (remainingDays <= expiryWarningDays) return "EXPIRING";
  return "SATISFIED";
}

export function planComplianceRemediation(
  context: ComplianceContext,
  requirement: ComplianceRequirement,
  assessment: ComplianceAssessment,
): RemediationPlan | null {
  required(context.idempotency_key, "idempotency_key");
  required(context.correlation_id, "correlation_id");
  if (requirement.company_id !== context.company_id) throw new Error("compliance_company_mismatch");
  if (assessment === "SATISFIED") return null;
  return { kind: "REVIEW_REQUIRED", company_id: context.company_id, requirement_id: requirement.requirement_id, assessment, idempotency_key: context.idempotency_key, correlation_id: context.correlation_id };
}

