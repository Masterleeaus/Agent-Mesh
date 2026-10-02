export type FinanceRecordKind = "quote" | "invoice" | "payment" | "refund" | "order" | "inventory";

export interface FinanceEvidenceRecord {
  company_id: string;
  record_id: string;
  kind: FinanceRecordKind;
  correlation_id: string;
  idempotency_key: string;
  currency: string;
  amount_minor: number;
  provider: string;
  provider_ref: string;
  source_evidence_ref: string;
  provider_reread_ref?: string;
  verified: boolean;
}

export function normalizeFinanceEvidence(record: FinanceEvidenceRecord): FinanceEvidenceRecord {
  if (!record.company_id || !record.record_id || !record.correlation_id || !record.idempotency_key) throw new Error("company, identity, correlation, and idempotency are required");
  if (!record.provider || !record.provider_ref || !record.source_evidence_ref) throw new Error("provider provenance and source evidence are required");
  if (typeof record.currency !== "string" || record.currency.length !== 3 || !/^[A-Za-z]{3}$/.test(record.currency) || !Number.isSafeInteger(record.amount_minor) || record.amount_minor < 0) throw new Error("amount must be a non-negative minor-unit value with ISO currency");
  if (record.verified && !record.provider_reread_ref) throw new Error("provider reread is required before VERIFIED");
  return { ...record, currency: record.currency.toUpperCase() };
}

export function canMarkFinanceVerified(record: FinanceEvidenceRecord, companyId: string): boolean {
  return record.company_id === companyId && Boolean(record.source_evidence_ref && record.provider_reread_ref && record.provider_ref);
}

