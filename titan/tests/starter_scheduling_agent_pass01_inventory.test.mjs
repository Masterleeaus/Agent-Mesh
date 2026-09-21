import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildWorkforceScheduleRecurrence, evaluateWorkforceScheduleDue } from '../titan-workforce/scheduling/workforce-schedule-recurrence-runtime.mjs';
import { buildWorkloadCapacitySnapshot } from '../titan-workforce/capacity/workload-capacity-runtime.mjs';

const required = [
  'titan-workforce/scheduling/workforce-schedule-recurrence-runtime.mjs',
  'titan-workforce/scheduling/WorkforceScheduleRecurrence.schema.json',
  'titan-workforce/capacity/workload-capacity-runtime.mjs',
  'titan-workforce/capacity/WorkloadCapacitySnapshot.schema.json',
  'titan-workforce/contracts/AssignmentDecision.schema.json',
  'workforce/contracts/WorkerHandoffPacket.schema.json',
  'titan-runtime/authority/company-boundary.mjs',
  'titan-runtime/authority/execution-boundary.mjs',
  'titan-settings/control-plane/workforce-agent-overrides.mjs',
  'titan-settings/control-plane/workforce-global-defaults.mjs'
];

test('Scheduling Agent Pass 1 canonical seams exist', () => {
  for (const path of required) assert.equal(fs.existsSync(path), true, `missing ${path}`);
});

test('schedule recurrence remains company scoped and non-authoritative', () => {
  const schedule = buildWorkforceScheduleRecurrence({ company_id: 'company-a', now: 1000, schedules: [{ schedule_id: 's1', frequency: 'ONCE', start_at: 1000 }] });
  const due = evaluateWorkforceScheduleDue(schedule, { company_id: 'company-a', now: 1000 });
  assert.equal(due.instances[0].execution_permitted, false);
  assert.equal(due.instances[0].requires_fresh_authority_evaluation, true);
  assert.throws(() => evaluateWorkforceScheduleDue(schedule, { company_id: 'company-b', now: 1000 }), /cross-company/);
});

test('capacity snapshot recommends only; it never grants reassignment authority', () => {
  const graph = { schema: 'titan.workforce.graph.v1', company_id: 'company-a', nodes: [{ kind: 'worker', company_id: 'company-a', node_id: 'worker:w1', label: 'Worker 1' }], edges: [], projection_revision: 1 };
  const snapshot = buildWorkloadCapacitySnapshot({ company_id: 'company-a', default_worker_capacity_units: 8 }, graph, { company_id: 'company-a', roster: [{ worker_id: 'w1', capacity_units: 8 }], assignments: [{ company_id: 'company-a', worker_id: 'w1', demand_units: 10 }] });
  assert.equal(snapshot.worker_capacity[0].state, 'OVERLOADED');
  assert.equal(snapshot.recommendations[0].automatic_reassignment, false);
  assert.equal(snapshot.execution_permitted, false);
  assert.equal(snapshot.grants_authority, false);
});
