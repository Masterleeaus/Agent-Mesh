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
const SHA_C = 'c'.repeat(64);
const NOW = Date.parse('2026-09-12T21:00:00.000Z');

function verdict(overrides = {}) {
  return {
    schema: 'titan-code-bridge-envelope/v1',
    message_id: 'tcmsg_pass8_verdict_0001',
    correlation_id: 'corr_pass8_0001',
    causation_id: 'tcmsg_pass8_request_0001',
    idempotency_key: 'idem_pass8_verdict_0001',
    type: 'SUPERVISOR_VERDICT',
    sender: { id: 'supervisor', role: 'SUPERVISOR', surface: 'CHATGPT' },
    recipient: { id: 'manager', role: 'MANAGER', surface: 'TITAN_CODE' },
    authority: {
      source: 'SUPERVISOR', scope: ['verification.verdict'],
      canonical_promotion: false, verification_verdict: true, cleanup_mutation: false,
    },
    created_at: '2026-09-12T20:59:00.000Z',
    payload: {
      request_message_id: 'tcmsg_pass8_request_0001',
      artifact: { name: 'delta.zip', sha256: SHA_A },
      baseline_sha256: SHA_B,
      verdict: 'PASS',
      findings: [],
      evidence_refs: ['verify/pass8'],
      required_actions: [],
    },
    ...overrides,
  };
}

(async () => {
  const handled = [];
  const storage = storageAdapter();
  const store = new BridgeReplayStore({ storage });
  const bridge = new ManagerExternalBridge({
    store,
    now: () => NOW,
    activeBaselineSha256: () => SHA_B,
    onSupervisorEvidence: async (normalized) => {
      handled.push(normalized);
      return { accepted: true };
    },
  });

  const first = await bridge.ingest(verdict());
  assert.equal(first.status, 'HANDLED');
  assert.equal(handled.length, 1);

  // Reconstruct bridge/store over the same durable storage. Completed replay must not invoke Manager again.
  const restarted = new ManagerExternalBridge({
    store: new BridgeReplayStore({ storage }),
    now: () => NOW,
    activeBaselineSha256: () => SHA_B,
    onSupervisorEvidence: async (normalized) => {
      handled.push(normalized);
      return { accepted: true };
    },
  });
  const replay = await restarted.ingest(verdict());
  assert.equal(replay.status, 'COMPLETED_REPLAY');
  assert.equal(handled.length, 1);

  const stale = verdict({
    message_id: 'tcmsg_pass8_stale_0001',
    idempotency_key: 'idem_pass8_stale_0001',
    created_at: '2026-09-12T20:00:00.000Z',
  });
  await assert.rejects(() => restarted.ingest(stale), { code: 'ERR_TITAN_CODE_MANAGER_BRIDGE_STALE_RESPONSE' });
  assert.equal(handled.length, 1, 'stale response must fail before Manager handler');

  const future = verdict({
    message_id: 'tcmsg_pass8_future_0001',
    idempotency_key: 'idem_pass8_future_0001',
    created_at: '2026-09-12T21:01:00.000Z',
  });
  await assert.rejects(() => restarted.ingest(future), { code: 'ERR_TITAN_CODE_MANAGER_BRIDGE_FUTURE_RESPONSE' });
  assert.equal(handled.length, 1, 'future response must fail before Manager handler');

  const mismatch = verdict({
    message_id: 'tcmsg_pass8_baseline_0001',
    idempotency_key: 'idem_pass8_baseline_0001',
    payload: { ...verdict().payload, baseline_sha256: SHA_C },
  });
  await assert.rejects(() => restarted.ingest(mismatch), { code: 'ERR_TITAN_CODE_MANAGER_BRIDGE_BASELINE_MISMATCH' });
  assert.equal(handled.length, 1, 'baseline mismatch must fail before Manager handler');

  const impersonation = verdict({
    message_id: 'tcmsg_pass8_imperson_0001',
    idempotency_key: 'idem_pass8_imperson_0001',
    sender: { id: 'librarian', role: 'LIBRARIAN', surface: 'CHATGPT' },
    authority: {
      source: 'LIBRARIAN', scope: ['verification.verdict'],
      canonical_promotion: false, verification_verdict: true, cleanup_mutation: false,
    },
  });
  await assert.rejects(() => restarted.ingest(impersonation), /Invalid Titan Code bridge envelope|direction/i);
  assert.equal(handled.length, 1);

  const promotion = verdict({
    message_id: 'tcmsg_pass8_promote_0001',
    idempotency_key: 'idem_pass8_promote_0001',
    authority: { ...verdict().authority, canonical_promotion: true },
  });
  await assert.rejects(() => restarted.ingest(promotion), { code: 'ERR_TITAN_CODE_BRIDGE_ENVELOPE' });
  assert.equal(handled.length, 1);

  const malformed = verdict({
    message_id: 'tcmsg_../../escape',
    idempotency_key: 'idem_pass8_malformed_0001',
  });
  await assert.rejects(() => restarted.ingest(malformed), { code: 'ERR_TITAN_CODE_BRIDGE_ENVELOPE' });
  assert.equal(handled.length, 1);

  console.log('PASS test-titan-zero-bridge-recovery-security');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
