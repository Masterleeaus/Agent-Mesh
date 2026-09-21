'use strict';

const assert = require('node:assert/strict');
const { BridgeReplayStore } = require('../src/titan-zero/bridge-store');
const { ManagerExternalBridge } = require('../src/titan-zero/manager-external-bridge');

function storageAdapter() {
  const state = {};
  return {
    async get(key) { return { [key]: state[key] }; },
    async set(values) { Object.assign(state, JSON.parse(JSON.stringify(values))); },
  };
}

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);
function baseEnvelope(overrides = {}) {
  return {
    schema: 'titan-code-bridge-envelope/v1',
    message_id: 'tcmsg_pass7_msg_0001',
    correlation_id: 'corr_pass7_0001',
    idempotency_key: 'idem_pass7_0001',
    type: 'VERIFY_REQUEST',
    sender: { id: 'manager', role: 'MANAGER', surface: 'TITAN_CODE' },
    recipient: { id: 'supervisor', role: 'SUPERVISOR', surface: 'CHATGPT' },
    authority: {
      source: 'MANAGER', scope: ['verification.request'],
      canonical_promotion: false, verification_verdict: false, cleanup_mutation: false,
    },
    created_at: '2026-09-12T20:50:00.000Z',
    payload: {
      artifact: { name: 'delta.zip', sha256: SHA_A },
      baseline_sha256: SHA_B,
      checks: ['TESTS'],
      evidence_refs: [],
    },
    ...overrides,
  };
}

function supervisorVerdict(overrides = {}) {
  return baseEnvelope({
    message_id: 'tcmsg_pass7_verdict_0001',
    idempotency_key: 'idem_pass7_verdict_0001',
    causation_id: 'tcmsg_pass7_msg_0001',
    type: 'SUPERVISOR_VERDICT',
    sender: { id: 'supervisor', role: 'SUPERVISOR', surface: 'CHATGPT' },
    recipient: { id: 'manager', role: 'MANAGER', surface: 'TITAN_CODE' },
    authority: {
      source: 'SUPERVISOR', scope: ['verification.verdict'],
      canonical_promotion: false, verification_verdict: true, cleanup_mutation: false,
    },
    payload: {
      request_message_id: 'tcmsg_pass7_msg_0001',
      artifact: { name: 'delta.zip', sha256: SHA_A },
      baseline_sha256: SHA_B,
      verdict: 'PASS',
      findings: [],
      evidence_refs: ['verify/pass7'],
      required_actions: [],
    },
    ...overrides,
  });
}

function librarianVerdict(overrides = {}) {
  return baseEnvelope({
    message_id: 'tcmsg_pass7_lib_0001',
    idempotency_key: 'idem_pass7_lib_0001',
    causation_id: 'tcmsg_pass7_cleanup_0001',
    type: 'CLEANUP_VERDICT',
    sender: { id: 'librarian', role: 'LIBRARIAN', surface: 'CHATGPT' },
    recipient: { id: 'manager', role: 'MANAGER', surface: 'TITAN_CODE' },
    authority: {
      source: 'LIBRARIAN', scope: ['cleanup.eligibility'],
      canonical_promotion: false, verification_verdict: false, cleanup_mutation: false,
    },
    payload: {
      request_message_id: 'tcmsg_pass7_cleanup_0001',
      artifact: { name: 'old.zip', sha256: SHA_A },
      baseline_sha256: SHA_B,
      review_kind: 'CLEANUP',
      decision: 'ELIGIBLE',
      retained_lineage_sha256: SHA_B,
      evidence_refs: ['librarian/pass7'],
      reasons: ['Superseded and reconstructable'],
    },
    ...overrides,
  });
}

(async () => {
  const storage = storageAdapter();
  const store = new BridgeReplayStore({ storage });
  const sent = [];
  const supervisorHandled = [];
  const librarianHandled = [];
  const transport = {
    async send(envelope) {
      sent.push(envelope.message_id);
      return { ok: true, provider: 'titan-bridge', endpoint: '/v1/action' };
    },
  };
  const bridge = new ManagerExternalBridge({
    store,
    transport,
    now: () => Date.parse('2026-09-12T20:50:10.000Z'),
    onSupervisorEvidence: async (value) => { supervisorHandled.push(value); return { accepted: true, kind: value.kind }; },
    onLibrarianEvidence: async (value) => { librarianHandled.push(value); return { accepted: true, kind: value.kind }; },
  });

  const outbound = baseEnvelope();
  const first = await bridge.dispatch(outbound);
  assert.equal(first.status, 'DISPATCHED');
  assert.equal(first.grants_authority, false);
  assert.equal(sent.length, 1);
  const replay = await bridge.dispatch(outbound);
  assert.equal(replay.status, 'COMPLETED_REPLAY');
  assert.equal(sent.length, 1, 'logical replay must not dispatch twice');

  const supervisor = supervisorVerdict();
  const handledSupervisor = await bridge.ingest(supervisor);
  assert.equal(handledSupervisor.status, 'HANDLED');
  assert.equal(handledSupervisor.normalized.verdict, 'PASS');
  assert.equal(supervisorHandled.length, 1);
  const supervisorReplay = await bridge.ingest(supervisor);
  assert.equal(supervisorReplay.status, 'COMPLETED_REPLAY');
  assert.equal(supervisorHandled.length, 1, 'inbound replay must not invoke handler twice');

  const librarian = librarianVerdict();
  const handledLibrarian = await bridge.ingest(librarian);
  assert.equal(handledLibrarian.status, 'HANDLED');
  assert.equal(handledLibrarian.normalized.review_kind, 'CLEANUP');
  assert.equal(librarianHandled.length, 1);

  await assert.rejects(() => bridge.dispatch(supervisorVerdict()), { code: 'ERR_TITAN_CODE_MANAGER_BRIDGE_DIRECTION' });
  await assert.rejects(() => bridge.ingest(baseEnvelope()), { code: 'ERR_TITAN_CODE_MANAGER_BRIDGE_DIRECTION' });

  const noTransport = new ManagerExternalBridge({ store: new BridgeReplayStore({ storage: storageAdapter() }) });
  await assert.rejects(() => noTransport.dispatch(baseEnvelope({ message_id: 'tcmsg_pass7_notrans_01', idempotency_key: 'idem_pass7_notrans_01' })), { code: 'ERR_TITAN_CODE_MANAGER_BRIDGE_TRANSPORT' });

  const authorityBridge = new ManagerExternalBridge({
    store: new BridgeReplayStore({ storage: storageAdapter() }),
    transport: { async send() { return { ok: true, grants_authority: true }; } },
  });
  await assert.rejects(() => authorityBridge.dispatch(baseEnvelope({ message_id: 'tcmsg_pass7_auth_0001', idempotency_key: 'idem_pass7_auth_0001' })), { code: 'ERR_TITAN_CODE_MANAGER_BRIDGE_PROVIDER_AUTHORITY' });

  console.log('PASS test-titan-zero-manager-external-bridge');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
