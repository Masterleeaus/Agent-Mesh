/**
 * Canonical, provider-neutral field-service lifecycle.
 *
 * Native Titan FSM remains the system of record. This module is the stable
 * contract and deterministic fold used by authenticated adapters, Workforce,
 * providers, evidence, and finance projections. It never mutates persistence.
 */

export const FIELD_SERVICE_LIFECYCLE_SCHEMA = 'titan.field-service.lifecycle.v2';
export const STATES = Object.freeze([
  'REQUESTED', 'QUOTED', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS',
  'COMPLETED', 'INVOICING_READY', 'PAID',
]);

const STAGE_BY_STATE = Object.freeze({
  REQUESTED: 'request_accepted', QUOTED: 'quote_approved', APPROVED: 'work_order_created',
  SCHEDULED: 'appointment_scheduled', IN_PROGRESS: 'work_started', COMPLETED: 'completion_verified',
  INVOICING_READY: 'billing_ready', PAID: 'payment_recorded',
});
const STATE_INDEX = new Map(STATES.map((state, index) => [state, index]));
const REFERENCE_FIELDS = Object.freeze({
  customer_ref: 'customer_id', contact_ref: 'contact_id', location_ref: 'location_id',
  request_id: 'service_request_id', service_request_ref: 'service_request_id', job_ref: 'job_id',
  work_order_ref: 'work_order_id', quote_ref: 'quote_id', appointment_ref: 'appointment_id',
  dispatch_ref: 'dispatch_id', invoice_ref: 'invoice_id', payment_ref: 'payment_id',
  worker_ref: 'worker_id', worker_id: 'worker_id', vehicle_ref: 'vehicle_id', vehicle_id: 'vehicle_id',
});
const NATIVE_STATE_MAP = Object.freeze({
  requested: 'REQUESTED', accepted: 'REQUESTED', quoted: 'QUOTED', quote_approved: 'QUOTED',
  approved: 'APPROVED', work_order_created: 'APPROVED', scheduled: 'SCHEDULED',
  appointment_scheduled: 'SCHEDULED', in_progress: 'IN_PROGRESS', started: 'IN_PROGRESS',
  completed: 'COMPLETED', completion_verified: 'COMPLETED', invoicing_ready: 'INVOICING_READY',
  billing_ready: 'INVOICING_READY', paid: 'PAID', payment_recorded: 'PAID',
});

const text = (value, code) => {
  const result = String(value ?? '').trim();
  if (!result) throw new Error(code);
  return result;
};
const list = (value) => (Array.isArray(value) ? value : []);
const clone = (value) => (value == null ? value : structuredClone(value));
const uniqueRefs = (value) => Object.freeze([...new Set(list(value).map((item) => text(item, 'lifecycle-reference-required')))].sort());

function rejectLegacy(value, path = 'field-service-lifecycle') {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach((item, index) => rejectLegacy(item, `${path}[${index}]`));
  for (const [key, child] of Object.entries(value)) {
    if (['tenant_id', 'tenant_company_id', 'tenant_company', 'tenantId'].includes(key)) {
      throw new Error(`legacy-company-boundary:${path}.${key}`);
    }
    rejectLegacy(child, `${path}.${key}`);
  }
}

function sameCompany(expected, actual) {
  if (text(expected, 'lifecycle-company-id-required') !== text(actual, 'lifecycle-company-id-required')) {
    throw new Error('lifecycle-cross-company');
  }
}

function referencesFrom(input, fallback = {}) {
  const result = { ...fallback };
  for (const [source, target] of Object.entries(REFERENCE_FIELDS)) {
    const value = input[source];
    if (value != null && String(value).trim()) result[target] = text(value, `lifecycle-${target}-required`);
  }
  if (input.task_refs != null || input.task_ids != null) result.task_ids = [...uniqueRefs(input.task_refs ?? input.task_ids)];
  return result;
}

function eventEvidence(input, prior = []) {
  return [...new Set([...prior, ...uniqueRefs(input.evidence_refs)])];
}

function validateStateTransition(current, next) {
  const currentIndex = current === 'REQUESTED' ? 0 : STATE_INDEX.get(current);
  const nextIndex = STATE_INDEX.get(next);
  if (nextIndex !== currentIndex + 1) throw new Error(`lifecycle-transition-invalid:${current}->${next}`);
}

function validateOutcome(current, input, next, evidenceRefs) {
  if (next === 'COMPLETED') {
    if (!evidenceRefs.length) throw new Error('lifecycle-completed-evidence-required');
    if (input.provider_acknowledged === true && input.verified !== true) throw new Error('provider-ack-is-not-verified-completion');
    if (input.verified !== true) throw new Error('lifecycle-completion-verification-required');
  }
  if (next === 'INVOICING_READY') {
    if (!current.completion_verified) throw new Error('lifecycle-completion-not-verified');
    if (!Number.isInteger(Number(input.line_count)) || Number(input.line_count) < 1) throw new Error('lifecycle-invoiceable-lines-required');
    if (!evidenceRefs.length) throw new Error('lifecycle-invoicing-evidence-required');
  }
  if (next === 'PAID') {
    text(input.payment_ref ?? input.payment_id ?? input.references?.payment_id, 'lifecycle-payment-id-required');
    if (!evidenceRefs.length) throw new Error('lifecycle-payment-evidence-required');
  }
}

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

export function createFieldServiceLifecycle(input = {}) {
  rejectLegacy(input);
  const company_id = text(input.company_id, 'lifecycle-company-id-required');
  const request_id = text(input.request_id ?? input.service_request_ref, 'lifecycle-request-id-required');
  const references = referencesFrom({ ...input, request_id }, {});
  const state = {
    schema: FIELD_SERVICE_LIFECYCLE_SCHEMA,
    company_id,
    lifecycle_id: text(input.lifecycle_id ?? `lifecycle:${request_id}`, 'lifecycle-id-required'),
    request_id,
    state: 'REQUESTED',
    stage: 'request_accepted',
    revision: 0,
    references,
    evidence_refs: [],
    events: [],
    completion_verified: false,
    provider_acknowledged: false,
    invoiceable_line_count: 0,
    authority_effect: false,
    grants_authority: false,
  };
  return freeze(state);
}

export function appendFieldServiceLifecycleEvent(current, event) {
  rejectLegacy(event);
  if (!current || current.schema !== FIELD_SERVICE_LIFECYCLE_SCHEMA) throw new Error('lifecycle-required');
  sameCompany(current.company_id, event.company_id);
  sameCompany(current.lifecycle_id, event.lifecycle_id);
  const idempotency_key = text(event.idempotency_key, 'lifecycle-idempotency-key-required');
  const prior = current.events.find((candidate) => candidate.idempotency_key === idempotency_key);
  if (prior) {
    if (prior.state !== event.state) throw new Error('lifecycle-idempotency-conflict');
    return current;
  }
  const revision = Number(event.revision);
  if (!Number.isInteger(revision) || revision !== current.revision + 1) throw new Error('lifecycle-revision-conflict');
  const next = text(event.state, 'lifecycle-next-state-required');
  if (!STATE_INDEX.has(next)) throw new Error(`lifecycle-state-invalid:${next}`);
  validateStateTransition(current.state, next);
  const authority_decision_ref = text(event.authority_decision_ref, 'lifecycle-authority-decision-required');
  const evidence_refs = eventEvidence(event, current.evidence_refs);
  validateOutcome(current, event, next, evidence_refs);
  const references = referencesFrom(event, { ...current.references, ...(event.references ?? {}) });
  const eventRecord = freeze({
    event_id: text(event.event_id ?? `${current.lifecycle_id}:${revision}`, 'lifecycle-event-id-required'),
    idempotency_key,
    company_id: current.company_id,
    lifecycle_id: current.lifecycle_id,
    revision,
    state: next,
    stage: STAGE_BY_STATE[next],
    authority_decision_ref,
    execution_id: event.execution_id ?? null,
    evidence_refs: [...evidence_refs],
    references: clone(references),
    verified: event.verified === true,
    provider_acknowledged: event.provider_acknowledged === true,
    line_count: Number.isInteger(Number(event.line_count)) ? Number(event.line_count) : null,
    occurred_at: text(event.occurred_at ?? new Date().toISOString(), 'lifecycle-event-time-required'),
  });
  return freeze({
    ...current,
    state: next,
    stage: STAGE_BY_STATE[next],
    revision,
    references,
    evidence_refs,
    events: [...current.events, eventRecord],
    completion_verified: current.completion_verified || (next === 'COMPLETED' && event.verified === true),
    provider_acknowledged: current.provider_acknowledged || event.provider_acknowledged === true,
    invoiceable_line_count: next === 'INVOICING_READY' ? Number(event.line_count) : current.invoiceable_line_count,
  });
}

export function transitionFieldServiceLifecycle(current, input = {}) {
  rejectLegacy(input);
  const event = {
    ...input,
    company_id: input.company_id ?? current.company_id,
    lifecycle_id: input.lifecycle_id ?? current.lifecycle_id,
    revision: input.revision ?? current.revision + 1,
  };
  return appendFieldServiceLifecycleEvent(current, event);
}

export function replayFieldServiceLifecycle(events) {
  if (!Array.isArray(events) || events.length === 0) throw new Error('lifecycle-events-required');
  const first = events[0];
  let state = createFieldServiceLifecycle({
    company_id: first.company_id,
    lifecycle_id: first.lifecycle_id,
    request_id: first.references?.service_request_id ?? first.service_request_id ?? `${first.lifecycle_id}:request`,
    ...first.references,
  });
  for (const event of events) state = appendFieldServiceLifecycleEvent(state, event);
  return state;
}

export function projectNativeFieldServiceLifecycle(input = {}) {
  rejectLegacy(input);
  const company_id = text(input.company_id, 'lifecycle-company-id-required');
  const nativeState = text(input.native_state, 'native-field-service-state-required').toLowerCase();
  const state = NATIVE_STATE_MAP[nativeState];
  if (!state) throw new Error(`lossy-native-state:${nativeState}`);
  const evidence_refs = uniqueRefs(input.evidence_refs);
  const completion_verified = input.completion_verified === true || (state === 'COMPLETED' && input.verified === true);
  if (state === 'COMPLETED' && (!completion_verified || !evidence_refs.length)) throw new Error('completion-evidence-required');
  const references = referencesFrom(input, {});
  return freeze({
    schema: FIELD_SERVICE_LIFECYCLE_SCHEMA,
    company_id,
    lifecycle_id: text(input.lifecycle_id ?? `${company_id}:native`, 'lifecycle-id-required'),
    state,
    stage: STAGE_BY_STATE[state],
    revision: Number.isInteger(input.revision) ? input.revision : 0,
    references,
    evidence_refs: [...evidence_refs],
    completion_verified,
    provider_acknowledged: input.provider_acknowledged === true,
    invoiceable_line_count: Number.isInteger(Number(input.line_count)) ? Number(input.line_count) : 0,
    authority_effect: false,
    grants_authority: false,
    native_state: nativeState,
  });
}

export async function executeFieldServiceTransition({ gateway, lifecycle, input = {} }) {
  if (!gateway || typeof gateway.execute !== 'function') throw new Error('lifecycle-execution-gateway-required');
  const idempotency_key = text(input.idempotency_key, 'lifecycle-idempotency-key-required');
  const authority_decision_ref = text(input.authority_decision_ref, 'lifecycle-authority-decision-required');
  const result = await gateway.execute({
    execution_id: input.execution_id ?? `${lifecycle.lifecycle_id}:${lifecycle.revision + 1}`,
    company_id: lifecycle.company_id,
    decision_id: authority_decision_ref,
    work_id: lifecycle.references.work_order_id ?? lifecycle.references.job_id ?? lifecycle.lifecycle_id,
    capability: 'field-service.lifecycle.transition',
    idempotency_key,
    input: { lifecycle_id: lifecycle.lifecycle_id, next_state: input.state, references: referencesFrom(input, lifecycle.references) },
    authority: { status: 'approved' },
    risk: { status: 'approved' },
  });
  if (result?.state !== 'VERIFIED' || result?.evidence?.verification?.verified !== true) throw new Error('lifecycle-governed-execution-unverified');
  return transitionFieldServiceLifecycle(lifecycle, {
    ...input,
    execution_id: result.execution_id,
    evidence_refs: [...list(input.evidence_refs), result.evidence.evidence_id],
    verified: input.verified ?? true,
  });
}

export function summarizeFieldServiceLifecycle(current = {}) {
  return freeze({
    company_id: current.company_id,
    lifecycle_id: current.lifecycle_id,
    state: current.state,
    stage: current.stage,
    revision: Number(current.revision || 0),
    events: list(current.events).length,
    verified_completion: current.completion_verified === true,
    invoice_ready: current.state === 'INVOICING_READY' && Number(current.invoiceable_line_count) > 0,
    authority_effect: false,
  });
}

