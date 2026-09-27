import test from 'node:test';
import assert from 'node:assert/strict';
import { planCleaningJobCompletion } from '../titan-business-services/runtime/customer-quote-flow.mjs';

const base = {
  company_id: 'company-1',
  job_id: 'job-1',
  work_order_id: 'wo-1',
  booking_ref: 'booking-1',
  quote_ref: 'quote-1',
  correlation_id: 'corr-1',
  job_receipt: { company_id: 'company-1', authoritative: true, source_ref: 'jobs:job-1' },
  current_state: 'qa_ready',
  field_context: { context: { tasks: [{ task_id: 'task-1', required: true, status: 'done' }], checklist: [{ item_id: 'check-1', required: true, completed: true }], equipment: [] } },
  execution_context: {
    company_id: 'company-1',
    checklist: [{ company_id: 'company-1', task_id: 'task-1', required: true, state: 'complete', source_ref: 'scope:quote-1' }],
    evidence_requirements: [
      { company_id: 'company-1', requirement_id: 'before-kitchen', stage: 'before', required: true, satisfied: true, evidence_refs: ['photo:before'], source_ref: 'scope:quote-1' },
      { company_id: 'company-1', requirement_id: 'after-kitchen', stage: 'after', required: true, satisfied: true, evidence_refs: ['photo:after'], source_ref: 'scope:quote-1' },
    ],
  },
  exceptions: [],
  request_invoice: true,
};

test('clean completion QA preserves before/after evidence and produces existing completion proposal only', () => {
  const plan = planCleaningJobCompletion(base);
  assert.equal(plan.state, 'completion_proposal_ready');
  assert.deepEqual(plan.qa.before_evidence_outstanding, []);
  assert.deepEqual(plan.qa.after_evidence_outstanding, []);
  assert.deepEqual(plan.qa.evidence_refs, ['photo:before', 'photo:after']);
  assert.equal(plan.next.capability, 'crm.work_order.complete');
  assert.equal(plan.next.permitted, true);
  assert.equal(plan.next.direct_mutation, false);
  assert.equal(plan.restrictions.work_order_completion_performed, false);
});

test('missing required before or after evidence blocks completion proposal', () => {
  const beforeMissing = planCleaningJobCompletion({ ...base, execution_context: { ...base.execution_context, evidence_requirements: [{ ...base.execution_context.evidence_requirements[0], satisfied: false, evidence_refs: [] }, base.execution_context.evidence_requirements[1]] } });
  assert.equal(beforeMissing.state, 'completion_qa_blocked');
  assert.ok(beforeMissing.qa.blockers.includes('BEFORE_EVIDENCE:before-kitchen'));
  const afterMissing = planCleaningJobCompletion({ ...base, execution_context: { ...base.execution_context, evidence_requirements: [base.execution_context.evidence_requirements[0], { ...base.execution_context.evidence_requirements[1], satisfied: false, evidence_refs: [] }] } });
  assert.ok(afterMissing.qa.blockers.includes('AFTER_EVIDENCE:after-kitchen'));
});

test('incomplete checklist remains blocked through existing Jobs evidence readiness', () => {
  const plan = planCleaningJobCompletion({ ...base, execution_context: { ...base.execution_context, checklist: [{ ...base.execution_context.checklist[0], state: 'pending' }] } });
  assert.equal(plan.next.permitted, false);
  assert.ok(plan.qa.blockers.includes('EVIDENCE:REQUIRED_CHECKLIST_INCOMPLETE'));
});

test('unresolved damage/rework exception blocks completion and is not silently resolved', () => {
  const plan = planCleaningJobCompletion({ ...base, exceptions: [{ company_id: 'company-1', exception_id: 'ex-1', type: 'rework', status: 'OPEN', blocks_completion: true, source_ref: 'qa:ex-1' }] });
  assert.equal(plan.state, 'completion_qa_blocked');
  assert.ok(plan.qa.blockers.includes('UNRESOLVED_EXCEPTION_OR_REWORK'));
  assert.equal(plan.restrictions.exception_resolution_performed, false);
});

test('completion QA enforces company isolation and legacy tenant rejection', () => {
  assert.throws(() => planCleaningJobCompletion({ ...base, tenant_company_id: 'legacy' }), /legacy tenant boundaries/i);
  assert.throws(() => planCleaningJobCompletion({ ...base, execution_context: { ...base.execution_context, company_id: 'company-2' } }), /cross-company execution_context/i);
  assert.throws(() => planCleaningJobCompletion({ ...base, exceptions: [{ company_id: 'company-2', exception_id: 'ex-1' }] }), /cross-company exceptions\[0\]/i);
});

test('authoritative job receipt remains mandatory and QA never grants authority', () => {
  assert.throws(() => planCleaningJobCompletion({ ...base, job_receipt: { company_id: 'company-1', authoritative: false, source_ref: 'jobs:job-1' } }), /authoritative job receipt/i);
  const plan = planCleaningJobCompletion(base);
  assert.equal(plan.authority_neutral, true);
  assert.equal(plan.execution_authority, false);
  assert.equal(plan.next.grants_authority, false);
  assert.equal(plan.restrictions.evidence_acceptance_performed, false);
});
