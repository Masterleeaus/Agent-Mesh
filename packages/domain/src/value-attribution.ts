/** Reconstructable business-value projection over verified outcome/cost evidence. */

export type ValueContext = { company_id: string; correlation_id: string };
export type ValueEvidence = { company_id: string; attribution_key: string; evidence_id: string; outcome_id: string; gross_value_cents: number; cost_cents: number; verified: boolean; correction_of?: string | null };
export type ValueLedger = { company_id: string; entries: readonly ValueEvidence[]; gross_value_cents: number; cost_cents: number; net_value_cents: number; margin_percent: number | null };

function required(value: string, name: string): void {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`value_${name}_required`);
}

export function projectVerifiedValue(context: ValueContext, evidence: ValueEvidence[]): ValueLedger {
  required(context.company_id, "company_id");
  const scoped = evidence.filter(item => item.company_id === context.company_id && item.verified);
  const corrections = new Set(scoped.flatMap(item => item.correction_of ? [item.correction_of] : []));
  const seen = new Set<string>();
  const entries = scoped.filter(item => {
    if (corrections.has(item.evidence_id) || seen.has(item.attribution_key)) return false;
    seen.add(item.attribution_key);
    return true;
  });
  const gross_value_cents = entries.reduce((sum, item) => sum + item.gross_value_cents, 0);
  const cost_cents = entries.reduce((sum, item) => sum + item.cost_cents, 0);
  const net_value_cents = gross_value_cents - cost_cents;
  return { company_id: context.company_id, entries, gross_value_cents, cost_cents, net_value_cents, margin_percent: gross_value_cents ? (net_value_cents / gross_value_cents) * 100 : null };
}

