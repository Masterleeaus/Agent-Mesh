import test from 'node:test';
import assert from 'node:assert/strict';
import { planCleaningJobExecutionContext } from '../titan-business-services/runtime/customer-quote-flow.mjs';

const base = {
  company_id: 'company-1',
  job_id: 'job-1',
  work_order_id: 'wo-1',
  booking_ref: 'book-1',
  quote_ref: 'quote-1',
  customer_id: 'cust-1',
  correlation_id: 'corr-1',
  journey_id: 'journey-1',
  job_receipt: { company_id: 'company-1', authoritative: true, source_ref: 'jobs:job-1' },
  site_context: { company_id: 'company-1', property_id: 'property-1' },
  checklist: [
    { company_id: 'company-1', task_id: 'task-kitchen', label: 'Clean kitchen', area: 'kitchen', completion_criteria: 'surfaces complete', required: true, source_ref: 'scope:quote-1', state: 'pending' },
  ],
  site_instructions: [
    { company_id: 'company-1', instruction_id: 'instruction-access', instruction: 'Use side gate', category: 'access', source_ref: 'customer:instruction-1', customer_confirmed: true },
  ],
  hazards: [
    { company_id: 'company-1', hazard_id: 'hazard-wet-floor', description: 'Wet entry tiles', severity: 'low', observed: true, source_ref: 'site:prestart-1', controls: ['signage'] },
  ],
  evidence_requirements: [
    { company_id: 'company-1', requirement_id: 'evidence-kitchen-after', kind: 'photo', area: 'kitchen', stage: 'after', source_ref: 'scope:quote-1', required: true, satisfied: false },
  ],
};

test('verified cleaning context binds checklist, site instruction, hazard and evidence requirements to job', () => {
  const plan = planCleaningJobExecutionContext(base);
  assert.equal(plan.state, 'execution_context_ready');
  assert.equal(plan.job_ref.job_id, 'job-1');
  assert.equal(plan.job_ref.booking_ref, 'book-1');
  assert.equal(plan.execution_context.checklist[0].task_id, 'task-kitchen');
  assert.equal(plan.execution_context.site_instructions[0].customer_confirmed, true);
  assert.equal(plan.execution_context.hazards[0].requires_authorised_review, false);
  assert.deepEqual(plan.gates.required_checklist_outstanding, ['task-kitchen']);
  assert.deepEqual(plan.gates.required_evidence_outstanding, ['evidence-kitchen-after']);
  assert.equal(plan.next.target, 'Jobs Agent');
  assert.equal(plan.next.direct_mutation, false);
  assert.equal(plan.restrictions.job_completion_performed, false);
});

test('high, unknown or inferred hazards require authorised review instead of clearance', () => {
  const high = planCleaningJobExecutionContext({ ...base, hazards: [{ company_id: 'company-1', hazard_id: 'h1', description: 'chemical spill', severity: 'high', observed: true, source_ref: 'site:h1' }] });
  assert.equal(high.state, 'execution_context_review_required');
  assert.equal(high.gates.authorised_review_required, true);
  const inferred = planCleaningJobExecutionContext({ ...base, hazards: [{ company_id: 'company-1', hazard_id: 'h2', description: 'possible mould', severity: 'low', observed: false, source_ref: 'inspection:h2' }] });
  assert.equal(inferred.execution_context.hazards[0].requires_authorised_review, true);
});

test('evidence is tracked but never treated as accepted or job completion by this planner', () => {
  const plan = planCleaningJobExecutionContext({ ...base, evidence_requirements: [{ ...base.evidence_requirements[0], satisfied: true, evidence_refs: ['photo:123'] }] });
  assert.deepEqual(plan.gates.required_evidence_outstanding, []);
  assert.deepEqual(plan.execution_context.evidence_requirements[0].evidence_refs, ['photo:123']);
  assert.equal(plan.gates.completion_may_be_inferred, false);
  assert.equal(plan.restrictions.evidence_acceptance_performed, false);
  assert.equal(plan.restrictions.job_completion_performed, false);
});

test('verified source references are mandatory for checklist, instructions, hazards and evidence', () => {
  assert.throws(() => planCleaningJobExecutionContext({ ...base, checklist: [{ company_id: 'company-1', task_id: 't1' }] }), /checklist item source_ref/i);
  assert.throws(() => planCleaningJobExecutionContext({ ...base, site_instructions: [{ company_id: 'company-1', instruction_id: 'i1' }] }), /site instruction item source_ref/i);
  assert.throws(() => planCleaningJobExecutionContext({ ...base, hazards: [{ company_id: 'company-1', hazard_id: 'h1' }] }), /hazard item source_ref/i);
  assert.throws(() => planCleaningJobExecutionContext({ ...base, evidence_requirements: [{ company_id: 'company-1', requirement_id: 'e1' }] }), /evidence requirement item source_ref/i);
});

test('job execution context enforces company isolation and rejects legacy tenant boundaries', () => {
  assert.throws(() => planCleaningJobExecutionContext({ ...base, site_context: { company_id: 'company-2' } }), /cross-company site_context/i);
  assert.throws(() => planCleaningJobExecutionContext({ ...base, hazards: [{ ...base.hazards[0], company_id: 'company-2' }] }), /cross-company hazards\[0\]/i);
  assert.throws(() => planCleaningJobExecutionContext({ ...base, tenant_company_id: 'legacy' }), /legacy tenant boundaries/i);
});

test('authoritative existing-job receipt is required before execution context is attached', () => {
  assert.throws(() => planCleaningJobExecutionContext({ ...base, job_receipt: { company_id: 'company-1', authoritative: false, source_ref: 'jobs:job-1' } }), /authoritative job receipt/i);
});
