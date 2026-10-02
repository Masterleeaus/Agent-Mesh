/** Presentation only. These labels never decide execution authority. */
export function workState(value) {
  const state = String(value ?? 'UNKNOWN').toUpperCase();
  const labels = {
    CREATED: 'Queued', READY: 'Ready', CLAIMED: 'Claimed', IN_PROGRESS: 'Active', RUNNING: 'Active',
    BLOCKED: 'Blocked', WAITING: 'Waiting', WAITING_APPROVAL: 'Approval needed', WAITING_EXTERNAL: 'Waiting for external result',
    WAITING_TOOL: 'Waiting for tool', WAITING_USER: 'Human input needed', SUSPENDED: 'Suspended',
    PROVIDER_ACKNOWLEDGED: 'Provider acknowledged — not verified', VERIFYING: 'Verifying',
    VERIFIED: 'Verified', COMPLETED: 'Run completed — outcome verification separate',
    FAILED: 'Failed', CANCELLED: 'Cancelled', RECOVERED: 'Recovered', COMPENSATED: 'Compensated',
  };
  return labels[state] ?? `Unknown / attention (${state.slice(0, 64)})`;
}
export function position(worker) {
  if (worker.kind === 'human') return 'Human participant';
  const labels = { worker: 'Worker', specialist: 'Specialist', manager: 'Manager', orchestrator: 'Orchestrator', supervisor: 'Manager (legacy supervisor)' };
  return labels[String(worker.role ?? worker.tier).toLowerCase()] ?? 'Position not supplied';
}
export function verifiedOutcome(receipt) {
  // Never promote COMPLETED, provider acknowledgement, or agent self-report.
  return receipt?.state === 'VERIFIED' && receipt?.verification?.status === 'VERIFIED' &&
    Array.isArray(receipt.evidence_refs) && receipt.evidence_refs.length > 0;
}
export function scoped(value, companyId) {
  if (!value || typeof value !== 'object' || value.company_id !== companyId) throw new Error('workforce-company-mismatch');
  return value;
}
export function assertNestedCompany(value, companyId) {
  if (!value || typeof value !== 'object') return;
  if (Object.hasOwn(value, 'company_id') && value.company_id !== companyId) throw new Error('workforce-company-mismatch');
  for (const child of Object.values(value)) assertNestedCompany(child, companyId);
}
export function boundedText(value) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).slice(0, 4000) : 'Not supplied';
}

export function receiptState(receipt) {
  if (verifiedOutcome(receipt)) return 'Verified outcome with evidence';
  if (receipt?.state === 'VERIFIED') return 'Verification unproven — evidence or observed verification missing';
  return workState(receipt?.state);
}
