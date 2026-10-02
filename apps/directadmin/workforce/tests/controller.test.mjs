import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { workState, verifiedOutcome } from '../images/presentation.mjs';
const source = (await readFile(new URL('../images/controller.mjs', import.meta.url), 'utf8')).replace("'workforce-presentation'", JSON.stringify(new URL('../images/presentation.mjs', import.meta.url).href));
const { WorkforceController } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const context = () => ({ company_id: 'company-a', actor_id: 'actor-a', session_revision: '1' });
function fixture() {
  const calls = [];
  return { calls, context: async () => context(), discover: async () => ({ company_id: 'company-a', workers: [] }), status: async () => ({ company_id: 'company-a', work: [] }), metadata: async () => ({ source: 'fixture-owner', freshness: null, evidence_refs: [] }), control: async (ctx, action) => { calls.push(action); return { company_id: ctx.company_id, state: 'PROVIDER_ACKNOWLEDGED' }; } };
}
test('loads actual transport projections and submits once without optimistic success', async () => {
  const api = fixture(); const model = new WorkforceController(api); await model.connect();
  assert.equal(model.state.phase, 'ready');
  await Promise.all([model.submit({ action: 'pause', work_id: 'w1' }), model.submit({ action: 'pause', work_id: 'w1' })]);
  assert.equal(api.calls.length, 1); assert.equal(model.state.receipt.state, 'PROVIDER_ACKNOWLEDGED');
  assert.equal(verifiedOutcome(model.state.receipt), false);
});
test('rejects cross-company root and nested data and clears prior projections', async () => {
  for (const payload of [{ company_id: 'company-b' }, { company_id: 'company-a', workers: [{ company_id: 'company-b', worker_id: 'private-b' }] }]) {
    const api = fixture(); api.discover = async () => payload; const model = new WorkforceController(api); await model.connect();
    assert.equal(model.state.phase, 'denied'); assert.equal(model.state.discovery, null); assert.doesNotMatch(JSON.stringify(model.state), /private-b/);
  }
});
test('revocation before submit prevents any action request', async () => {
  const api = fixture(); const model = new WorkforceController(api); await model.connect();
  api.context = async () => ({ ...context(), session_revision: '2' }); await model.submit({ action: 'resume' });
  assert.equal(api.calls.length, 0); assert.equal(model.state.phase, 'denied'); assert.equal(model.state.context, null);
});
test('company switch discards in-flight prior company response', async () => {
  const api = fixture(); let release;
  api.discover = () => new Promise(resolve => { release = resolve; });
  const model = new WorkforceController(api); const pending = model.connect(); await new Promise(resolve => setImmediate(resolve));
  model.invalidate(); release({ company_id: 'company-a', workers: [{ company_id: 'company-a', worker_id: 'old-private' }] }); await pending;
  assert.equal(model.state.discovery, null); assert.equal(model.state.phase, 'denied');
});
test('revocation while action in flight discards receipt', async () => {
  const api = fixture(); let release; api.control = () => new Promise(resolve => { release = resolve; });
  const model = new WorkforceController(api); await model.connect(); const pending = model.submit({ action: 'pause' });
  await new Promise(resolve => setImmediate(resolve)); model.invalidate(); release({ company_id: 'company-a', state: 'VERIFIED' }); await pending;
  assert.equal(model.state.receipt, null);
});
test('denied and unavailable responses erase data and redact errors', async () => {
  for (const error of ['titan-api-http-403 secret=do-not-render', 'ECONNRESET internal-host=private']) {
    const api = fixture(); const model = new WorkforceController(api); await model.connect(); api.control = async () => { throw Error(error); }; await model.submit({ action: 'pause' });
    assert.equal(model.state.discovery, null); assert.equal(model.state.context, null); assert.doesNotMatch(JSON.stringify(model.state), /do-not-render|internal-host/);
    assert.equal(model.state.phase, error.includes('403') ? 'denied' : 'unavailable');
  }
});
test('hosted action denial revalidates the same company, while revoked context stays cleared', async () => {
  for (const revoked of [false, true]) {
    const api = fixture();
    const canonicalContext = api.context;
    let contextReads = 0;
    api.context = async () => {
      contextReads++;
      if (revoked && contextReads === 3) throw Error('directadmin-http-401');
      return canonicalContext();
    };
    api.control = async () => { throw Error('directadmin-workforce-action-denied'); };
    const model = new WorkforceController(api);
    await model.connect();
    await model.submit({ action: 'cancel', work_id: 'company-a-work', reason: 'owner denial fixture' });
    assert.equal(contextReads, 3, '403 recovery makes one fresh canonical-context read');
    assert.equal(model.state.phase, revoked ? 'denied' : 'ready');
    assert.equal(model.state.context?.company_id ?? null, revoked ? null : 'company-a');
    assert.equal(model.state.discovery === null, revoked, 'revoked identity cannot retain the prior projection');
    assert.equal(model.state.receipt, null, 'a denied request never fabricates or preserves a receipt');
    if (!revoked) assert.match(model.state.error, /denied.*refreshed/);
  }
});
test('reassignment denial, unknown outcome and stale response remain distinct and fail closed', async () => {
  const action = { action: 'reassign', work_id: 'ready-work', target_worker_id: 'worker-target', reason: 'Move the ready item' };
  const deniedApi = fixture(); const deniedModel = new WorkforceController(deniedApi); await deniedModel.connect();
  deniedApi.control = async () => { throw Error('directadmin-workforce-action-denied'); };
  await deniedModel.submit(action);
  assert.equal(deniedModel.state.phase, 'ready');
  assert.equal(deniedModel.state.context?.company_id, 'company-a');
  assert.equal(deniedModel.state.receipt, null);
  assert.match(deniedModel.state.error, /host denied that request/i);

  const uncertainApi = fixture(); const uncertainModel = new WorkforceController(uncertainApi); await uncertainModel.connect();
  uncertainApi.control = async () => { throw Error('directadmin-http-503'); };
  await uncertainModel.submit(action);
  assert.equal(uncertainModel.state.phase, 'unavailable');
  assert.equal(uncertainModel.state.context, null);
  assert.equal(uncertainModel.state.discovery, null);
  assert.equal(uncertainModel.state.receipt, null);
  assert.match(uncertainModel.state.error, /outcome is unknown/i);

  const staleApi = fixture(); const staleModel = new WorkforceController(staleApi); await staleModel.connect();
  let controlCalls = 0; staleApi.control = async () => { controlCalls++; return { company_id: 'company-a', state: 'REQUESTED', receipt_id: 'stale' }; };
  staleApi.context = async () => ({ ...context(), context_revision: '2' });
  await staleModel.submit(action);
  assert.equal(controlCalls, 0, 'stale company/session context prevents the governed request');
  assert.equal(staleModel.state.phase, 'denied');
  assert.equal(staleModel.state.context, null);
  assert.equal(staleModel.state.receipt, null);

  const lateApi = fixture(); let release; let entered;
  const reachedOwner = new Promise(resolve => { entered = resolve; });
  lateApi.control = () => new Promise(resolve => { release = resolve; entered(); });
  const lateModel = new WorkforceController(lateApi); await lateModel.connect();
  const pending = lateModel.submit(action); await reachedOwner; lateModel.invalidate();
  release({ company_id: 'company-a', state: 'REQUESTED', receipt_id: 'late-reassignment-receipt', evidence_refs: ['late-evidence'] });
  await pending;
  assert.equal(lateModel.state.phase, 'denied');
  assert.equal(lateModel.state.context, null);
  assert.equal(lateModel.state.receipt, null, 'a late prior-company acknowledgement cannot restore receipt/evidence');
});
test('late 403 after invalidation cannot reconnect or restore company data', async () => {
  for (const error of ['directadmin-http-403', 'directadmin-workforce-action-denied']) {
    const api = fixture();
    const originalContext = api.context;
    let contextReads = 0;
    api.context = async () => { contextReads++; return originalContext(); };
    let rejectControl;
    let enteredControl;
    const entered = new Promise(resolve => { enteredControl = resolve; });
    api.control = () => new Promise((_, reject) => { rejectControl = reject; enteredControl(); });
    const model = new WorkforceController(api);
    await model.connect();
    const submission = model.submit({ action: 'cancel', work_id: 'company-a-work' });
    await entered;
    model.invalidate();
    rejectControl(Error(error));
    await submission;
    assert.equal(contextReads, 2, `${error}: stale response does not trigger a second context read`);
    assert.equal(model.state.phase, 'denied');
    assert.equal(model.state.context, null);
    assert.equal(model.state.discovery, null);
    assert.equal(model.state.receipt, null);
  }
});
test('403 during post-submit refresh never claims the governed action was denied', async () => {
  const api = fixture();
  let model;
  let statusReads = 0;
  api.status = async () => {
    statusReads++;
    if (statusReads === 2) throw Error('directadmin-http-403');
    return { company_id: 'company-a', work: [] };
  };
  model = new WorkforceController(api);
  await model.connect();
  await model.submit({ action: 'cancel', work_id: 'company-a-work' });
  assert.equal(api.calls.length, 1, 'the governed ingress completed before refresh failed');
  assert.equal(model.state.phase, 'denied');
  assert.equal(model.state.context, null);
  assert.equal(model.state.receipt, null, 'session invalidation clears the local receipt');
  assert.match(model.state.error, /request was submitted.*could not be refreshed/i);
  assert.doesNotMatch(model.state.error, /host denied/i);
});
test('completion/ACK/self-report cannot claim verified outcome', () => {
  for (const state of ['COMPLETED', 'SUCCEEDED', 'PROVIDER_ACKNOWLEDGED']) {
    assert.equal(verifiedOutcome({ state, verified: true, evidence_refs: ['e1'] }), false);
    assert.notEqual(workState(state), 'Verified');
  }
  assert.equal(verifiedOutcome({ state: 'VERIFIED', verification: { status: 'VERIFIED' }, evidence_refs: ['e1'] }), true);
  assert.equal(verifiedOutcome({ state: 'VERIFIED', verification: { status: 'VERIFIED' }, evidence_refs: [] }), false);
});
test('controls stay serialized until canonical refresh finishes', async () => {
  const api = fixture(); const model = new WorkforceController(api); await model.connect(); let release;
  api.status = () => new Promise(resolve => { release = resolve; });
  const pending = model.submit({ action: 'pause' }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(model.state.phase, 'submitting'); await model.submit({ action: 'resume' }); assert.equal(api.calls.length, 1);
  release({ company_id: 'company-a', work: [] }); await pending; assert.equal(model.state.phase, 'ready');
});
test('unsupported VERIFIED receipt never renders verified outcome', async () => {
  const { receiptState } = await import('../images/presentation.mjs');
  assert.match(receiptState({ state: 'VERIFIED' }), /unproven/);
  assert.match(receiptState({ state: 'VERIFIED', verification: { status: 'VERIFIED' }, evidence_refs: [] }), /unproven/);
});
test('SDK summary is authority-neutral and clears evidence after denial', async () => {
  const { workforceContribution } = await import('../images/presentation.mjs');
  const ready = workforceContribution({ phase: 'ready', status: { work: [{ evidence_refs: ['fixture-evidence'] }] } }, 'reseller');
  assert.deepEqual(ready.widgets[0].permitted_actions, []);
  assert.deepEqual(ready.widgets[0].evidence_refs, ['fixture-evidence']);
  assert.equal(ready.navigation[0].route, '/CMD_PLUGINS_RESELLER/titan_workforce');
  const denied = workforceContribution({ phase: 'denied', status: { work: [{ evidence_refs: ['stale-evidence'] }] } });
  assert.deepEqual(denied.widgets[0].evidence_refs, []);
  assert.equal(denied.widgets[0].status, 'permission-denied');
});
test('malformed projection cannot masquerade as empty authorised roster', async () => {
  for (const discovery of [{ company_id: 'company-a' }, { company_id: 'company-a', workers: [{ worker_id: 'unscoped', kind: 'digital' }] }, { company_id: 'company-a', workers: [{ company_id: 'company-a', worker_id: 'ambiguous', kind: 'provider' }] }]) {
    const api = fixture(); api.discover = async () => discovery;
    const model = new WorkforceController(api); await model.connect();
    assert.notEqual(model.state.phase, 'ready'); assert.equal(model.state.discovery, null);
  }
});
test('context without a session revision is denied', async () => {
  const api = fixture(); api.context = async () => ({ company_id: 'company-a', actor_id: 'actor-a' });
  const model = new WorkforceController(api); await model.connect(); assert.equal(model.state.phase, 'denied');
});
test('malformed evidence references cannot label an outcome verified', () => {
  for (const evidence_refs of [[null], [''], ['   '], [{}], ['valid', null]]) {
    assert.equal(verifiedOutcome({ state: 'VERIFIED', verification: { status: 'VERIFIED' }, evidence_refs }), false);
  }
});
test('malformed optional collections fail closed before any view consumes them', async () => {
  const worker = { company_id: 'company-a', worker_id: 'w1', kind: 'digital' };
  const work = { company_id: 'company-a', work_id: 'job1', state: 'RUNNING' };
  for (const invalid of [null, {}, 'not-an-array', [null], [''], [{}]]) {
    for (const field of ['capabilities', 'context_refs', 'evidence_refs', 'required_capabilities', 'controls']) {
      const api = fixture();
      api.discover = async () => ({ company_id: 'company-a', workers: [{ ...worker, ...(field === 'capabilities' ? { capabilities: invalid } : {}) }], ...(field === 'controls' ? { controls: invalid } : {}) });
      api.status = async () => ({ company_id: 'company-a', work: [{ ...work, ...(['context_refs', 'evidence_refs', 'required_capabilities'].includes(field) ? { [field]: invalid } : {}) }] });
      const observed = [];
      const model = new WorkforceController(api, state => observed.push(state.phase));
      await model.connect();
      assert.equal(model.state.phase, 'unavailable', `${field}: ${JSON.stringify(invalid)}`);
      assert.equal(model.state.context, null);
      assert.equal(observed.includes('ready'), false);
    }
  }
});
test('malformed canonical refresh clears the prior receipt and company data', async () => {
  const api = fixture(); const model = new WorkforceController(api); await model.connect();
  api.status = async () => ({ company_id: 'company-a', work: [{ company_id: 'company-a', work_id: 'job1', state: 'RUNNING', evidence_refs: {} }] });
  await model.submit({ action: 'pause' });
  assert.equal(model.state.phase, 'unavailable');
  assert.equal(model.state.receipt, null);
  assert.equal(model.state.discovery, null);
  assert.match(model.state.error, /outcome is unknown/);
});
test('malformed optional display scalars are rejected before later tab rendering', async () => {
  for (const invalid of [{ toString: null }, {}, [], 123, false]) {
    for (const field of ['run_id', 'role', 'tier']) {
      const api = fixture();
      api.discover = async () => ({ company_id: 'company-a', workers: [{ company_id: 'company-a', worker_id: 'w1', kind: 'digital', ...(field === 'run_id' ? {} : { [field]: invalid }) }] });
      api.status = async () => ({ company_id: 'company-a', work: [{ company_id: 'company-a', work_id: 'job1', state: 'RUNNING', ...(field === 'run_id' ? { run_id: invalid } : {}) }] });
      const model = new WorkforceController(api); await model.connect();
      assert.equal(model.state.phase, 'unavailable');
      assert.equal(model.state.context, null);
    }
  }
});
