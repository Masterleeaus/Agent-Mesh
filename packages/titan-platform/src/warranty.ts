const LEGACY_BOUNDARY_KEYS = new Set([
  'tenant_id','tenant_company_id','tenantId','tenantCompanyId',
  'business_id','account_id','workspace_id'
]);

export const TITAN_WARRANTY_SCHEMA = 'titan.business-ops.warranty.v1' as const;
export const TITAN_WARRANTY_CLAIM_SCHEMA = 'titan.business-ops.warranty-claim.v1' as const;

export type WarrantyCoverageType =
  | 'labor_only' | 'parts_only' | 'parts_and_labor'
  | 'manufacturer' | 'extended' | 'custom';
export type WarrantyLifecycleState = 'active' | 'expiring_soon' | 'expired' | 'voided';
export type WarrantyClaimType = 'labor' | 'parts' | 'parts_and_labor';
export type WarrantyClaimState = 'open' | 'approved' | 'denied' | 'completed';

export interface WarrantyProvenance {
  source: string;
  source_ref?: string | null;
  recorded_at: string;
  idempotency_key: string;
  trace_id?: string | null;
  correlation_id?: string | null;
}

export interface TitanWarrantyInput {
  warranty_id: string;
  company_id: string;
  source_job_id: string;
  source_work_order_id?: string | null;
  client_id: string;
  property_id?: string | null;
  asset_id?: string | null;
  title: string;
  description?: string | null;
  coverage_type: WarrantyCoverageType;
  coverage_scope?: string | null;
  start_date: string;
  end_date: string;
  covers_parts?: boolean;
  covers_labor?: boolean;
  manufacturer_name?: string | null;
  manufacturer_warranty_end_date?: string | null;
  max_claim_value_cents?: number | null;
  voided_reason?: string | null;
  provenance: WarrantyProvenance;
  [key: string]: unknown;
}

export interface TitanWarrantyClaimInput {
  claim_id: string;
  company_id: string;
  warranty_id: string;
  source_job_id: string;
  source_work_order_id?: string | null;
  claim_type: WarrantyClaimType;
  description: string;
  claimed_date: string;
  resolved_date?: string | null;
  labor_cost_cents?: number;
  parts_cost_cents?: number;
  state?: WarrantyClaimState;
  denied_reason?: string | null;
  resolution?: string | null;
  evidence_refs?: string[];
  provenance: WarrantyProvenance;
  [key: string]: unknown;
}

function rejectLegacy(value: unknown, path = 'input'): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((child, i) => rejectLegacy(child, `${path}[${i}]`));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (LEGACY_BOUNDARY_KEYS.has(key)) {
      throw new Error(`${path}.${key} is a legacy tenant boundary; company_id is required`);
    }
    rejectLegacy(child, `${path}.${key}`);
  }
}

function requiredString(value: unknown, label: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function optionalString(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function isoDate(value: unknown, label: string): string {
  const normalized = requiredString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(Date.parse(`${normalized}T00:00:00Z`))) {
    throw new Error(`${label} must be an ISO date`);
  }
  return normalized;
}

function nonNegativeCents(value: unknown, label: string): number {
  const amount = Number(value ?? 0);
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error(`${label} must be non-negative integer cents`);
  return amount;
}

function provenance(input: WarrantyProvenance): Readonly<WarrantyProvenance> {
  const recorded_at = requiredString(input?.recorded_at, 'provenance.recorded_at');
  if (Number.isNaN(Date.parse(recorded_at))) throw new Error('provenance.recorded_at must be an ISO date-time');
  return Object.freeze({
    source: requiredString(input?.source, 'provenance.source'),
    source_ref: optionalString(input?.source_ref),
    recorded_at,
    idempotency_key: requiredString(input?.idempotency_key, 'provenance.idempotency_key'),
    trace_id: optionalString(input?.trace_id),
    correlation_id: optionalString(input?.correlation_id),
  });
}

export function deriveWarrantyLifecycleState(input: {
  end_date: string;
  voided?: boolean;
  as_of?: string;
  expiring_window_days?: number;
}): WarrantyLifecycleState {
  if (input.voided) return 'voided';
  const end = isoDate(input.end_date, 'end_date');
  const asOf = isoDate(input.as_of ?? new Date().toISOString().slice(0, 10), 'as_of');
  const window = input.expiring_window_days ?? 30;
  if (!Number.isInteger(window) || window < 0) throw new Error('expiring_window_days must be a non-negative integer');
  const days = Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${asOf}T00:00:00Z`)) / 86400000);
  if (days < 0) return 'expired';
  if (days <= window) return 'expiring_soon';
  return 'active';
}

export function remainingWarrantyCoverageCents(maxClaimValueCents: number | null | undefined, approvedClaimCents: number): number | null {
  if (maxClaimValueCents == null) return null;
  const maximum = nonNegativeCents(maxClaimValueCents, 'max_claim_value_cents');
  const claimed = nonNegativeCents(approvedClaimCents, 'approved_claim_cents');
  return Math.max(0, maximum - claimed);
}

export function buildTitanWarranty(input: TitanWarrantyInput, options: { as_of?: string; expiring_window_days?: number } = {}) {
  rejectLegacy(input);
  const start_date = isoDate(input.start_date, 'start_date');
  const end_date = isoDate(input.end_date, 'end_date');
  if (Date.parse(`${end_date}T00:00:00Z`) < Date.parse(`${start_date}T00:00:00Z`)) {
    throw new Error('end_date must not precede start_date');
  }
  const voided = Boolean(optionalString(input.voided_reason));
  return Object.freeze({
    schema: TITAN_WARRANTY_SCHEMA,
    warranty_id: requiredString(input.warranty_id, 'warranty_id'),
    company_id: requiredString(input.company_id, 'company_id'),
    source_job_id: requiredString(input.source_job_id, 'source_job_id'),
    source_work_order_id: optionalString(input.source_work_order_id),
    client_id: requiredString(input.client_id, 'client_id'),
    property_id: optionalString(input.property_id),
    asset_id: optionalString(input.asset_id),
    title: requiredString(input.title, 'title'),
    description: optionalString(input.description),
    coverage_type: input.coverage_type,
    coverage_scope: optionalString(input.coverage_scope),
    start_date,
    end_date,
    covers_parts: input.covers_parts ?? ['parts_only','parts_and_labor','manufacturer','extended'].includes(input.coverage_type),
    covers_labor: input.covers_labor ?? ['labor_only','parts_and_labor','extended'].includes(input.coverage_type),
    manufacturer_name: optionalString(input.manufacturer_name),
    manufacturer_warranty_end_date: input.manufacturer_warranty_end_date ? isoDate(input.manufacturer_warranty_end_date, 'manufacturer_warranty_end_date') : null,
    max_claim_value_cents: input.max_claim_value_cents == null ? null : nonNegativeCents(input.max_claim_value_cents, 'max_claim_value_cents'),
    lifecycle_state: deriveWarrantyLifecycleState({ end_date, voided, ...options }),
    voided_reason: optionalString(input.voided_reason),
    provenance: provenance(input.provenance),
    document_refs: Object.freeze([] as string[]),
    proposal_only: true as const,
    automatic_warranty_creation: false as const,
    automatic_job_creation: false as const,
    automatic_change_order_creation: false as const,
    automatic_invoicing: false as const,
    requires_fresh_authority: true as const,
    grants_authority: false as const,
    execution_permitted: false as const,
  });
}

export function buildTitanWarrantyClaim(input: TitanWarrantyClaimInput) {
  rejectLegacy(input);
  const state = input.state ?? 'open';
  const labor_cost_cents = nonNegativeCents(input.labor_cost_cents, 'labor_cost_cents');
  const parts_cost_cents = nonNegativeCents(input.parts_cost_cents, 'parts_cost_cents');
  return Object.freeze({
    schema: TITAN_WARRANTY_CLAIM_SCHEMA,
    claim_id: requiredString(input.claim_id, 'claim_id'),
    company_id: requiredString(input.company_id, 'company_id'),
    warranty_id: requiredString(input.warranty_id, 'warranty_id'),
    source_job_id: requiredString(input.source_job_id, 'source_job_id'),
    source_work_order_id: optionalString(input.source_work_order_id),
    claim_type: input.claim_type,
    description: requiredString(input.description, 'description'),
    claimed_date: isoDate(input.claimed_date, 'claimed_date'),
    resolved_date: input.resolved_date ? isoDate(input.resolved_date, 'resolved_date') : null,
    labor_cost_cents,
    parts_cost_cents,
    total_cost_cents: labor_cost_cents + parts_cost_cents,
    state,
    denied_reason: optionalString(input.denied_reason),
    resolution: optionalString(input.resolution),
    evidence_refs: Object.freeze([...(input.evidence_refs ?? [])].map(x => requiredString(x, 'evidence_ref'))),
    provenance: provenance(input.provenance),
    proposal_only: true as const,
    may_reference_governed_job: true as const,
    may_reference_governed_change_order: true as const,
    automatic_job_creation: false as const,
    automatic_change_order_creation: false as const,
    automatic_approval: false as const,
    automatic_invoicing: false as const,
    requires_fresh_authority: true as const,
    grants_authority: false as const,
    execution_permitted: false as const,
  });
}
