import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkerAvailabilityCapacityState } from '../titan-workforce/scheduling/worker-availability-capacity-state.mjs';

const capacity = {
  schema: 'titan.workforce.workload-capacity.v1',
  company_id: 'company-a',
  worker_capacity: [
    { company_id: 'company-a', worker_id: 'w1', state: 'NORMAL', capacity_units: 8, demand_units: 3 },
    { company_id: 'company-a', worker_id: 'w2', state: 'OVERLOADED', capacity_units: 8, demand_units: 10 }
  ]
};

test('available worker with capacity is eligible for proposal only', () => {
  const result = buildWorkerAvailabilityCapacityState({
    company_id: 'company-a',
    capacity_snapshot: capacity,
    availability: [{ company_id: 'company-a', worker_id: 'w1', state: 'AVAILABLE', source_ref: 'roster:1' }]
  });
  const w1 = result.workers.find((w) => w.worker_id === 'w1');
  assert.equal(w1.eligible_for_scheduling_proposal, true);
  assert.equal(result.proposal_only, true);
  assert.equal(result.execution_permitted, false);
  assert.equal(result.grants_authority, false);
  assert.equal(result.requires_fresh_assignment_authority, true);
});

test('overloaded or unavailable workers fail closed', () => {
  const result = buildWorkerAvailabilityCapacityState({
    company_id: 'company-a',
    capacity_snapshot: capacity,
    availability: [
      { company_id: 'company-a', worker_id: 'w1', state: 'UNAVAILABLE' },
      { company_id: 'company-a', worker_id: 'w2', state: 'AVAILABLE' }
    ]
  });
  assert.deepEqual(result.workers[0].blockers, ['AVAILABILITY_UNAVAILABLE']);
  assert.ok(result.workers[1].blockers.includes('NO_AVAILABLE_CAPACITY'));
  assert.equal(result.summary.workers_eligible, 0);
});

test('missing availability becomes explicit review, never inferred available', () => {
  const result = buildWorkerAvailabilityCapacityState({
    company_id: 'company-a',
    capacity_snapshot: capacity,
    availability: []
  });
  assert.equal(result.state, 'AVAILABILITY_REVIEW_REQUIRED');
  assert.equal(result.summary.workers_unknown_availability, 2);
});

test('cross-company and legacy tenant boundaries are rejected', () => {
  assert.throws(() => buildWorkerAvailabilityCapacityState({
    company_id: 'company-a',
    capacity_snapshot: { ...capacity, company_id: 'company-b' }
  }), /cross-company/);

  assert.throws(() => buildWorkerAvailabilityCapacityState({
    company_id: 'company-a',
    tenant_company_id: 'legacy',
    capacity_snapshot: capacity
  }), /legacy tenant boundary/);
});
