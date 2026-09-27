'use strict';

const assert = require('assert');
const { createBridgeEnvelope } = require('../src/titan-zero/bridge-envelope');
const { BridgeReplayStore } = require('../src/titan-zero/bridge-store');

class MemoryStorage {
  constructor(seed = {}) { this.data = JSON.parse(JSON.stringify(seed)); }
  async get(key) { return { [key]: this.data[key] }; }
  async set(values) { Object.assign(this.data, JSON.parse(JSON.stringify(values))); }
}

function envelope(overrides = {}) {
  return createBridgeEnvelope({
    message_id: 'tcmsg_20260913_1001',
    correlation_id: 'tccorr_20260913_job_001',
    causation_id: 'tcmsg_20260913_root1',
    idempotency_key: 'tcidem_verify_packet_001',
    type: 'VERIFY_REQUEST',
    sender: { id: 'titan-code-manager', role: 'MANAGER', surface: 'TITAN_CODE' },
    recipient: { id: 'chatgpt-supervisor', role: 'SUPERVISOR', surface: 'CHATGPT' },
    authority: {
      source: 'MANAGER', scope: ['REQUEST_VERIFICATION'],
      canonical_promotion: false, verification_verdict: false, cleanup_mutation: false,
    },
    created_at: '2026-09-12T20:30:00.000Z',
    payload: { packet_id: 'TC-RESET-A2-BRIDGE-RESTORE-001', pass: 4 },
    ...overrides,
  });
}

(async () => {
  const storage = new MemoryStorage();
  const store = new BridgeReplayStore({ storage });
  const req = envelope();

  const first = await store.begin(req);
  assert.strictEqual(first.status, 'NEW');
  assert.strictEqual(first.record.state, 'PENDING');

  const duplicatePending = await store.begin(req);
  assert.strictEqual(duplicatePending.status, 'PENDING_REPLAY');
  assert.strictEqual(duplicatePending.record.message_id, req.message_id);

  const result = { accepted: true, receipt: 'verify-001' };
  await store.complete(req, result);
  const completedReplay = await store.begin(req);
  assert.strictEqual(completedReplay.status, 'COMPLETED_REPLAY');
  assert.deepStrictEqual(completedReplay.result, result);

  const reconstructed = new BridgeReplayStore({ storage });
  const restartReplay = await reconstructed.begin(req);
  assert.strictEqual(restartReplay.status, 'COMPLETED_REPLAY');
  assert.deepStrictEqual(restartReplay.result, result);

  await assert.rejects(
    () => reconstructed.begin(envelope({ message_id: 'tcmsg_20260913_1002', payload: { packet_id: 'DIFFERENT' } })),
    (error) => error && error.code === 'ERR_TITAN_CODE_BRIDGE_IDEMPOTENCY_CONFLICT'
  );

  await assert.rejects(
    () => reconstructed.begin(envelope({ idempotency_key: 'tcidem_verify_packet_002', payload: { packet_id: 'DIFFERENT' } })),
    (error) => error && error.code === 'ERR_TITAN_CODE_BRIDGE_MESSAGE_ID_CONFLICT'
  );

  const byCorrelation = await reconstructed.getByCorrelation(req.correlation_id);
  assert.strictEqual(byCorrelation.length, 1);
  assert.strictEqual(byCorrelation[0].message_id, req.message_id);

  const unorderedA = envelope({
    message_id: 'tcmsg_20260913_2001', correlation_id: 'tccorr_20260913_job_002',
    idempotency_key: 'tcidem_ordering_001', causation_id: undefined,
    payload: { b: 2, a: { z: 3, y: 4 } },
  });
  const unorderedB = envelope({
    message_id: 'tcmsg_20260913_2002', correlation_id: 'tccorr_20260913_job_002',
    idempotency_key: 'tcidem_ordering_001', causation_id: undefined,
    payload: { a: { y: 4, z: 3 }, b: 2 },
  });
  const orderingStore = new BridgeReplayStore({ storage: new MemoryStorage() });
  await orderingStore.begin(unorderedA);
  const semanticReplay = await orderingStore.begin(unorderedB);
  assert.strictEqual(semanticReplay.status, 'PENDING_REPLAY');

  const corrupted = new MemoryStorage({
    titan_code_bridge_replay_v1: { version: 1, records: [{ message_id: '../bad' }] },
  });
  const corruptStore = new BridgeReplayStore({ storage: corrupted });
  await assert.rejects(
    () => corruptStore.getByCorrelation('tccorr_20260913_job_001'),
    (error) => error && error.code === 'ERR_TITAN_CODE_BRIDGE_STORE_CORRUPT'
  );

  console.log('PASS test-titan-zero-bridge-store');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
