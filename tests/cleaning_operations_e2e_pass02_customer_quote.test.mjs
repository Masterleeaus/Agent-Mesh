import test from 'node:test';
import assert from 'node:assert/strict';
import { planCustomerToQuote } from '../titan-business-services/runtime/customer-quote-flow.mjs';

const base = {
  company_id: 'company-1',
  lead_id: 'lead-1',
  opportunity_id: 'opp-1',
  correlation_id: 'corr-1',
  journey_id: 'journey-1',
  interaction_context: { company_id: 'company-1', journey_id: 'journey-1', conversation_id: 'conv-1' },
  service_context: { company_id: 'company-1', service_type: 'cleaning', site_id: 'site-1' },
  duplicate_check: { company_id: 'company-1', checked: true, source_ref: 'crm:quote-search' },
  reasons: ['qualified cleaning lead requested quote'],
  evidence: [{ kind: 'qualification', summary: 'cleaning lead is quote-ready', source_ref: 'sales:qualification' }],
};

test('missing customer stages canonical customer creation before quote and preserves revenue continuity', () => {
  const plan = planCustomerToQuote(base);
  assert.equal(plan.state, 'customer_required');
  assert.equal(plan.next.workflow.capability, 'crm.customer.create');
  assert.equal(plan.next.continuation.workflow.capability, 'crm.quote.create');
  assert.equal(plan.next.continuation.required_output, 'customer_id');
  assert.deepEqual(plan.next.continuation.preserve_refs, {
    company_id: 'company-1', lead_id: 'lead-1', opportunity_id: 'opp-1', customer_id: null,
    correlation_id: 'corr-1', journey_id: 'journey-1', conversation_id: 'conv-1'
  });
  assert.equal(plan.authority_neutral, true);
  assert.equal(plan.execution_authority, false);
  assert.equal(plan.restrictions.crm_mutation_performed, false);
});

test('resolved customer produces existing governed Sales quote handoff', () => {
  const plan = planCustomerToQuote({ ...base, customer_id: 'cust-1' });
  assert.equal(plan.state, 'quote_ready');
  assert.equal(plan.next.handoff.workflow.capability, 'crm.quote.create');
  assert.equal(plan.next.handoff.lead_ref.customer_id, 'cust-1');
  assert.equal(plan.next.handoff.lead_ref.lead_id, 'lead-1');
  assert.equal(plan.next.handoff.lead_ref.opportunity_id, 'opp-1');
  assert.equal(plan.next.handoff.interaction_ref.correlation_id, 'corr-1');
  assert.equal(plan.next.handoff.interaction_ref.journey_id, 'journey-1');
});

test('customer resolution is company scoped and rejects legacy tenant authority', () => {
  assert.throws(() => planCustomerToQuote({ ...base, customer_context: { company_id: 'company-2' } }), /cross-company customer_context rejected/);
  assert.throws(() => planCustomerToQuote({ ...base, tenant_id: 'legacy' }), /legacy tenant boundaries/);
});

test('duplicate quote suppression remains delegated to existing Sales handoff', () => {
  const plan = planCustomerToQuote({
    ...base,
    customer_id: 'cust-1',
    duplicate_check: { company_id: 'company-1', checked: true, source_ref: 'crm:quote-search', existing_quote_id: 'quote-existing' }
  });
  assert.equal(plan.state, 'quote_duplicate_suppressed');
  assert.equal(plan.next.disposition, 'duplicate_suppressed');
  assert.equal(plan.next.handoff, null);
  assert.equal(plan.next.proposed_packet.lead_ref.customer_id, 'cust-1');
});
