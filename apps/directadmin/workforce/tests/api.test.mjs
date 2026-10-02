import assert from 'node:assert/strict';
import test from 'node:test';
import { WorkforceApi } from '../images/api.mjs';
const context = { company_id: 'company-a', actor_id: 'actor-a', session_revision: 1, context_revision: 'ctx1' };
function fixture(controls = [{ action: 'pause', capability_id: 'canonical.pause' }]) {
  const calls = []; return { calls,
    connect: async () => context,
    projection: async plugin => { calls.push(['projection', plugin]); return { company_id: context.company_id, source: 'controlled-test-owner', freshness: '2026-10-02T00:00:00.000Z', evidence_refs: [], data: { schema: 'titan.workforce-cockpit.v1', company_id: context.company_id,
      discovery: { company_id: context.company_id, workers: [], controls },
      status: { company_id: context.company_id, work: [] } } }; },
    intent: async (plugin, intent) => { calls.push(['intent', plugin, intent]); return { status: 'REQUESTED', receipt_id: 'receipt1', correlation_id: intent.correlation_id }; },
  };
}
test('consumer uses actual shared session routes and preserves REQUESTED acknowledgement', async () => {
  const session = fixture(); const api = new WorkforceApi(session, () => 'fixture-id'); const ctx = await api.context();
  await Promise.all([api.discover(ctx), api.status(ctx)]); assert.equal(session.calls.length, 1);
  const receipt = await api.control(ctx, { action: 'pause', work_id: 'work1', reason: 'Operator request', authority: 'root' });
  assert.equal(receipt.state, 'REQUESTED'); assert.deepEqual(receipt.evidence_refs, []);
  assert.deepEqual(session.calls[1], ['intent', 'titan_workforce', { company_id: 'company-a', actor_id: 'actor-a', capability_id: 'canonical.pause', operation_id: 'fixture-id', correlation_id: 'fixture-id', input: { action: 'pause', work_id: 'work1', reason: 'Operator request' } }]);
  await api.status(ctx); assert.equal(session.calls.length, 3); // post-effect refresh, not cached work truth
});
test('unsupported control and undiscovered capability never reach intent transport', async () => {
  for (const action of ['shell', 'resume', 'revoke']) {
    const session = fixture(); const api = new WorkforceApi(session); await assert.rejects(api.control(context, { action, work_id: 'work1', reason: 'test' }), /denied/);
    assert.equal(session.calls.filter(([kind]) => kind === 'intent').length, 0);
  }
});
test('published read-only projection is displayed but cannot submit a lifecycle intent', async () => {
  const session = fixture([]); const api = new WorkforceApi(session, () => 'fixture-id');
  const [discovery, status, metadata] = await Promise.all([api.discover(context), api.status(context), api.metadata(context)]);
  assert.deepEqual(discovery.controls, []);
  assert.deepEqual(status, { company_id: 'company-a', work: [] });
  assert.deepEqual(metadata, { source: 'controlled-test-owner', freshness: '2026-10-02T00:00:00.000Z', evidence_refs: [] });
  await assert.rejects(api.control(context, { action: 'cancel', work_id: 'work1', reason: 'must remain read-only' }), /denied/);
  assert.equal(session.calls.filter(([kind]) => kind === 'intent').length, 0);
});
test('gateway response cannot promote request acknowledgement to verified or mismatch correlation', async () => {
  for (const response of [{ status: 'VERIFIED', receipt_id: 'r', correlation_id: 'fixture-id' }, { status: 'REQUESTED', receipt_id: 'r', correlation_id: 'other' }]) {
    const session = fixture(); session.intent = async () => response; const api = new WorkforceApi(session, () => 'fixture-id');
    await assert.rejects(api.control(context, { action: 'pause', work_id: 'w', reason: 'test' }), /receipt-invalid/);
  }
});
test('cross-company or unversioned projection rejected', async () => {
  for (const projection of [{ company_id: 'company-b', data: { schema: 'titan.workforce-cockpit.v1' } }, { company_id: 'company-a', data: {} }]) {
    const session = fixture(); session.projection = async () => projection;
    await assert.rejects(new WorkforceApi(session).discover(context), /projection-invalid/);
  }
});
