'use strict';

const assert = require('assert');
const {
  BRIDGE_SCHEMA,
  createBridgeEnvelope,
  validateBridgeEnvelope,
} = require('../src/titan-zero/bridge-envelope');

function base(overrides = {}) {
  return {
    schema: BRIDGE_SCHEMA,
    message_id: 'tcmsg_20260913_0001',
    type: 'VERIFY_REQUEST',
    correlation_id: 'tccorr_20260913_job_001',
    causation_id: 'tcmsg_20260913_root1',
    idempotency_key: 'tcidem_verify_packet_001',
    sender: { id: 'titan-code-manager', role: 'MANAGER', surface: 'TITAN_CODE' },
    recipient: { id: 'chatgpt-supervisor', role: 'SUPERVISOR', surface: 'CHATGPT' },
    authority: {
      source: 'MANAGER',
      scope: ['REQUEST_VERIFICATION'],
      canonical_promotion: false,
      verification_verdict: false,
      cleanup_mutation: false,
    },
    created_at: '2026-09-12T20:24:00.000Z',
    payload: { packet_id: 'TC-RESET-A2-BRIDGE-RESTORE-001' },
    ...overrides,
  };
}

assert.strictEqual(BRIDGE_SCHEMA, 'titan-code-bridge-envelope/v1');

const envelope = createBridgeEnvelope(base());
assert.strictEqual(envelope.schema, BRIDGE_SCHEMA);
assert.strictEqual(envelope.sender.role, 'MANAGER');
assert.strictEqual(envelope.recipient.role, 'SUPERVISOR');
assert.strictEqual(envelope.correlation_id, 'tccorr_20260913_job_001');
assert.strictEqual(envelope.causation_id, 'tcmsg_20260913_root1');
assert.strictEqual(envelope.idempotency_key, 'tcidem_verify_packet_001');
assert.deepStrictEqual(validateBridgeEnvelope(envelope), { ok: true, errors: [] });

const wrongAuthority = base({
  authority: {
    source: 'MANAGER',
    scope: ['REQUEST_VERIFICATION'],
    canonical_promotion: true,
    verification_verdict: false,
    cleanup_mutation: false,
  },
});
const wrongAuthorityResult = validateBridgeEnvelope(wrongAuthority);
assert.strictEqual(wrongAuthorityResult.ok, false);
assert(wrongAuthorityResult.errors.some((x) => x.includes('canonical_promotion')));

const supervisorOverreach = base({
  sender: { id: 'chatgpt-supervisor', role: 'SUPERVISOR', surface: 'CHATGPT' },
  recipient: { id: 'titan-code-manager', role: 'MANAGER', surface: 'TITAN_CODE' },
  type: 'SUPERVISOR_VERDICT',
  authority: {
    source: 'SUPERVISOR',
    scope: ['VERIFY'],
    canonical_promotion: true,
    verification_verdict: true,
    cleanup_mutation: false,
  },
});
assert.strictEqual(validateBridgeEnvelope(supervisorOverreach).ok, false);

const librarianCleanup = base({
  sender: { id: 'chatgpt-librarian', role: 'LIBRARIAN', surface: 'CHATGPT' },
  recipient: { id: 'titan-code-manager', role: 'MANAGER', surface: 'TITAN_CODE' },
  type: 'CLEANUP_VERDICT',
  authority: {
    source: 'LIBRARIAN',
    scope: ['CLEANUP_RECOMMENDATION'],
    canonical_promotion: false,
    verification_verdict: false,
    cleanup_mutation: false,
  },
});
assert.strictEqual(validateBridgeEnvelope(librarianCleanup).ok, true);

for (const invalid of [
  base({ message_id: '' }),
  base({ correlation_id: '' }),
  base({ idempotency_key: '' }),
  base({ causation_id: '../bad' }),
  base({ created_at: 'not-a-date' }),
  base({ sender: { id: 'x', role: 'UNKNOWN', surface: 'CHATGPT' } }),
  base({ recipient: { id: 'x', role: 'SUPERVISOR', surface: 'UNKNOWN' } }),
  base({ payload: 'not-an-object' }),
]) {
  assert.strictEqual(validateBridgeEnvelope(invalid).ok, false);
}

const huge = 'x'.repeat(65537);
assert.strictEqual(validateBridgeEnvelope(base({ payload: { huge } })).ok, false);

console.log('PASS test-titan-zero-bridge-envelope');
