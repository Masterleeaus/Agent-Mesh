import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendFieldServiceLifecycleEvent,
  createFieldServiceLifecycle,
  executeFieldServiceTransition,
  projectNativeFieldServiceLifecycle,
  replayFieldServiceLifecycle,
  transitionFieldServiceLifecycle,
} from './field-service-lifecycle.mjs';

const start = {
  company_id: 'co-183',
  request_id: 'req-1',
  customer_ref: 'customer-1',
  contact_ref: 'contact-1',
  location_ref: 'site-1',
  job_ref: 'job-1',
  work_order_ref: 'job-1',
  quote_ref: 'quote-1',
  appointment_ref: 'appointment-1',
  dispatch_ref: 'dispatch-1',
  task_refs: ['task-1'],
};

const move = (state, n, extra = {}) => ({
  company_id: 'co-183',
  state,
  idempotency_key: `k-${n}`,
  authority_decision_ref: `decision-${n}`,
  evidence_refs: extra.evidence_refs || [],
  ...extra,
});

test('field-service lifecycle reaches verified invoice readiness', () => {
  let x = createFieldServiceLifecycle(start);
  for (const [state, n] of [['QUOTED', 1], ['APPROVED', 2], ['SCHEDULED', 3], ['IN_PROGRESS', 4]]) {
    x = transitionFieldServiceLifecycle(x, move(state, n));
  }
  x = transitionFieldServiceLifecycle(x, move('COMPLETED', 5, { verified: true, evidence_refs: ['completion-proof'] }));
  x = transitionFieldServiceLifecycle(x, move('INVOICING_READY', 6, { line_count: 1, evidence_refs: ['invoice-readiness'] }));
  assert.equal(x.state, 'INVOICING_READY');
  assert.equal(x.events.length, 6);
});

test('lifecycle is replay-safe and provider acknowledgement cannot be completion', () => {
  let x = createFieldServiceLifecycle(start);
  x = transitionFieldServiceLifecycle(x, move('QUOTED', 1));
  assert.equal(transitionFieldServiceLifecycle(x, move('QUOTED', 1)), x);
  assert.throws(() => transitionFieldServiceLifecycle(x, { ...move('APPROVED', 1) }), /lifecycle-idempotency-conflict/);
  for (const [state, n] of [['APPROVED', 2], ['SCHEDULED', 3], ['IN_PROGRESS', 4]]) {
    x = transitionFieldServiceLifecycle(x, move(state, n));
  }
  assert.throws(() => transitionFieldServiceLifecycle(x, move('COMPLETED', 5, { provider_acknowledged: true, evidence_refs: ['provider-ack'] })), /provider-ack-is-not-verified-completion/);
});

test('completion fails closed for missing evidence and foreign company', () => {
  let x = createFieldServiceLifecycle(start);
  for (const [state, n] of [['QUOTED', 1], ['APPROVED', 2], ['SCHEDULED', 3], ['IN_PROGRESS', 4]]) {
    x = transitionFieldServiceLifecycle(x, move(state, n));
  }
  assert.throws(() => transitionFieldServiceLifecycle(x, move('COMPLETED', 5, { provider_acknowledged: true })), /lifecycle-completed-evidence-required/);
  assert.throws(() => transitionFieldServiceLifecycle(x, { ...move('COMPLETED', 5, { verified: true, evidence_refs: ['e'] }), company_id: 'co-other' }), /lifecycle-cross-company/);
});

test('replay restores all canonical CRM references and rejects revision conflicts', () => {
  let next = createFieldServiceLifecycle(start);
  for (const [state, n, extra] of [
    ['QUOTED', 1, {}], ['APPROVED', 2, {}], ['SCHEDULED', 3, {}], ['IN_PROGRESS', 4, {}],
    ['COMPLETED', 5, { verified: true, evidence_refs: ['e-complete'] }],
    ['INVOICING_READY', 6, { invoice_ref: 'invoice-1', line_count: 2, evidence_refs: ['e-invoice'] }],
    ['PAID', 7, { payment_ref: 'payment-1', evidence_refs: ['e-payment'] }],
  ]) next = transitionFieldServiceLifecycle(next, move(state, n, extra));
  assert.equal(next.state, 'PAID');
  assert.deepEqual(next.references, {
    customer_id: 'customer-1', contact_id: 'contact-1', location_id: 'site-1', service_request_id: 'req-1',
    job_id: 'job-1', work_order_id: 'job-1', quote_id: 'quote-1', appointment_id: 'appointment-1',
    dispatch_id: 'dispatch-1', task_ids: ['task-1'], invoice_id: 'invoice-1', payment_id: 'payment-1',
  });
  assert.deepEqual(replayFieldServiceLifecycle(next.events).references, next.references);
  assert.throws(() => appendFieldServiceLifecycleEvent(next, { ...next.events.at(-1), revision: 99, idempotency_key: 'stale' }), /revision-conflict/);
});

test('native provider projection preserves native state and rejects lossy mappings', () => {
  const projection = projectNativeFieldServiceLifecycle({
    company_id: 'co-183', lifecycle_id: 'life-1', customer_id: 'customer-1', contact_id: 'contact-1',
    location_id: 'site-1', service_request_id: 'req-1', job_id: 'job-1', work_order_id: 'wo-1', quote_id: 'quote-1',
    appointment_id: 'visit-1', dispatch_id: 'dispatch-1', task_ids: ['task-1'], native_state: 'completed',
    provider_acknowledged: true, evidence_refs: ['e-1'], completion_verified: true,
  });
  assert.equal(projection.stage, 'completion_verified');
  assert.equal(projection.provider_acknowledged, true);
  assert.throws(() => projectNativeFieldServiceLifecycle({ ...projection, native_state: 'mystery' }), /lossy-native-state/);
});

test('consequential transition requires governed execution and independent verification', async () => {
  const lifecycle = createFieldServiceLifecycle(start);
  const calls = [];
  const gateway = { execute: async (request) => { calls.push(request); return { state: 'VERIFIED', evidence: { evidence_id: 'e-gateway', verification: { verified: true } } }; } };
  const next = await executeFieldServiceTransition({ gateway, lifecycle, input: move('QUOTED', 1) });
  assert.equal(next.state, 'QUOTED');
  assert.equal(calls[0].capability, 'field-service.lifecycle.transition');
  assert.equal(calls[0].company_id, 'co-183');
  assert.throws(() => projectNativeFieldServiceLifecycle({ company_id: 'co-183', lifecycle_id: 'life-1', native_state: 'completed', provider_acknowledged: true, evidence_refs: [], completion_verified: false }), /completion-evidence-required/);
});

