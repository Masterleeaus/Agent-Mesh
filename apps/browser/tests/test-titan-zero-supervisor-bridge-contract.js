'use strict';

const assert = require('node:assert/strict');
const {
  normalizeSupervisorBridgeMessage,
  SUPERVISOR_CHECKS,
  SUPERVISOR_VERDICTS,
  SEVERITIES,
} = require('../src/titan-zero/supervisor-bridge-contract');

const manager = { id: 'titan-code-manager', role: 'MANAGER', surface: 'TITAN_CODE' };
const supervisor = { id: 'chatgpt-supervisor', role: 'SUPERVISOR', surface: 'CHATGPT' };
const sha = 'a'.repeat(64);
const baseline = 'b'.repeat(64);

function base(type, sender, recipient, payload, overrides = {}) {
  return {
    schema: 'titan-code-bridge-envelope/v1',
    message_id: overrides.message_id || `tcmsg_${type.toLowerCase()}_0001`,
    correlation_id: overrides.correlation_id || 'corr_supervisor_0001',
    causation_id: overrides.causation_id,
    idempotency_key: overrides.idempotency_key || `idem_${type.toLowerCase()}_0001`,
    type,
    sender,
    recipient,
    authority: overrides.authority || {
      source: sender.role,
      scope: ['bridge.transport'],
      canonical_promotion: false,
      verification_verdict: type === 'SUPERVISOR_VERDICT',
      cleanup_mutation: false,
    },
    created_at: '2026-09-12T20:40:00.000Z',
    payload,
  };
}

function mustThrowCode(fn, code) {
  assert.throws(fn, (error) => error && error.code === code, code);
}

const verify = normalizeSupervisorBridgeMessage(base('VERIFY_REQUEST', manager, supervisor, {
  artifact: { name: 'lane-delta.zip', sha256: sha },
  baseline_sha256: baseline,
  checks: ['SYNTAX', 'TESTS', 'AUTHORITY_BOUNDARY'],
  evidence_refs: ['Agent 2/Evidence/pass-5.json'],
}));
assert.equal(verify.kind, 'SUPERVISOR_REQUEST');
assert.equal(verify.request_type, 'VERIFY_REQUEST');
assert.deepEqual(verify.checks, ['SYNTAX', 'TESTS', 'AUTHORITY_BOUNDARY']);
assert.equal(Object.isFrozen(verify), true);

const scan = normalizeSupervisorBridgeMessage(base('SCAN_REQUEST', manager, supervisor, {
  artifact: { name: 'lane-delta.zip', sha256: sha },
  baseline_sha256: baseline,
  checks: ['SECURITY', 'LINEAGE'],
  evidence_refs: [],
}));
assert.equal(scan.request_type, 'SCAN_REQUEST');

const verdict = normalizeSupervisorBridgeMessage(base('SUPERVISOR_VERDICT', supervisor, manager, {
  request_message_id: 'tcmsg_verify_request_0001',
  artifact: { name: 'lane-delta.zip', sha256: sha },
  baseline_sha256: baseline,
  verdict: 'PASS',
  findings: [],
  evidence_refs: ['Verification/pass-5.json'],
  required_actions: [],
}, {
  causation_id: 'tcmsg_verify_request_0001',
  authority: {
    source: 'SUPERVISOR',
    scope: ['verification.independent'],
    canonical_promotion: false,
    verification_verdict: true,
    cleanup_mutation: false,
  },
}));
assert.equal(verdict.kind, 'SUPERVISOR_VERDICT');
assert.equal(verdict.verdict, 'PASS');
assert.equal(verdict.request_message_id, 'tcmsg_verify_request_0001');
assert.equal(verdict.canonical_authority, false);

const remediation = normalizeSupervisorBridgeMessage(base('REMEDIATION_REQUEST', supervisor, manager, {
  request_message_id: 'tcmsg_verify_request_0001',
  artifact: { name: 'lane-delta.zip', sha256: sha },
  baseline_sha256: baseline,
  verdict: 'REMEDIATION_REQUIRED',
  findings: [{ code: 'AUTHORITY_DRIFT', severity: 'BLOCKING', message: 'Manager authority boundary was crossed.' }],
  evidence_refs: ['Verification/pass-5.json'],
  required_actions: ['Restore authority boundary'],
}, {
  causation_id: 'tcmsg_verify_request_0001',
  authority: {
    source: 'SUPERVISOR',
    scope: ['verification.independent'],
    canonical_promotion: false,
    verification_verdict: true,
    cleanup_mutation: false,
  },
}));
assert.equal(remediation.verdict, 'REMEDIATION_REQUIRED');
assert.equal(remediation.findings[0].severity, 'BLOCKING');

assert.ok(SUPERVISOR_CHECKS.includes('SYNTAX'));
assert.ok(SUPERVISOR_VERDICTS.includes('PASS'));
assert.ok(SEVERITIES.includes('BLOCKING'));

mustThrowCode(() => normalizeSupervisorBridgeMessage(base('VERIFY_REQUEST', supervisor, manager, {
  artifact: { name: 'x.zip', sha256: sha }, baseline_sha256: baseline, checks: ['SYNTAX'], evidence_refs: [],
})), 'ERR_TITAN_CODE_SUPERVISOR_DIRECTION');

mustThrowCode(() => normalizeSupervisorBridgeMessage(base('SUPERVISOR_VERDICT', manager, supervisor, {
  request_message_id: 'tcmsg_verify_request_0001', artifact: { name: 'x.zip', sha256: sha }, baseline_sha256: baseline,
  verdict: 'PASS', findings: [], evidence_refs: [], required_actions: [],
}, { causation_id: 'tcmsg_verify_request_0001' })), 'ERR_TITAN_CODE_BRIDGE_ENVELOPE');

mustThrowCode(() => normalizeSupervisorBridgeMessage(base('VERIFY_REQUEST', manager, supervisor, {
  artifact: { name: 'x.zip', sha256: 'not-a-sha' }, baseline_sha256: baseline, checks: ['SYNTAX'], evidence_refs: [],
})), 'ERR_TITAN_CODE_SUPERVISOR_PAYLOAD');

mustThrowCode(() => normalizeSupervisorBridgeMessage(base('VERIFY_REQUEST', manager, supervisor, {
  artifact: { name: 'x.zip', sha256: sha }, baseline_sha256: baseline, checks: ['UNKNOWN_CHECK'], evidence_refs: [],
})), 'ERR_TITAN_CODE_SUPERVISOR_PAYLOAD');

mustThrowCode(() => normalizeSupervisorBridgeMessage(base('VERIFY_REQUEST', manager, supervisor, {
  artifact: { name: 'x.zip', sha256: sha }, baseline_sha256: baseline, checks: ['SYNTAX'], evidence_refs: [], surprise: true,
})), 'ERR_TITAN_CODE_SUPERVISOR_PAYLOAD');

mustThrowCode(() => normalizeSupervisorBridgeMessage(base('SUPERVISOR_VERDICT', supervisor, manager, {
  request_message_id: 'tcmsg_other_request_0001', artifact: { name: 'x.zip', sha256: sha }, baseline_sha256: baseline,
  verdict: 'PASS', findings: [], evidence_refs: [], required_actions: [],
}, {
  causation_id: 'tcmsg_verify_request_0001',
  authority: { source: 'SUPERVISOR', scope: ['verification.independent'], canonical_promotion: false, verification_verdict: true, cleanup_mutation: false },
})), 'ERR_TITAN_CODE_SUPERVISOR_CAUSATION');

mustThrowCode(() => normalizeSupervisorBridgeMessage(base('SUPERVISOR_VERDICT', supervisor, manager, {
  request_message_id: 'tcmsg_verify_request_0001', artifact: { name: 'x.zip', sha256: sha }, baseline_sha256: baseline,
  verdict: 'PASS', findings: [{ code: 'FAIL', severity: 'BLOCKING', message: 'bad' }], evidence_refs: [], required_actions: [],
}, {
  causation_id: 'tcmsg_verify_request_0001',
  authority: { source: 'SUPERVISOR', scope: ['verification.independent'], canonical_promotion: false, verification_verdict: true, cleanup_mutation: false },
})), 'ERR_TITAN_CODE_SUPERVISOR_PAYLOAD');

mustThrowCode(() => normalizeSupervisorBridgeMessage(base('REMEDIATION_REQUEST', supervisor, manager, {
  request_message_id: 'tcmsg_verify_request_0001', artifact: { name: 'x.zip', sha256: sha }, baseline_sha256: baseline,
  verdict: 'REMEDIATION_REQUIRED', findings: [], evidence_refs: [], required_actions: [],
}, {
  causation_id: 'tcmsg_verify_request_0001',
  authority: { source: 'SUPERVISOR', scope: ['verification.independent'], canonical_promotion: false, verification_verdict: true, cleanup_mutation: false },
})), 'ERR_TITAN_CODE_SUPERVISOR_PAYLOAD');

console.log('PASS test-titan-zero-supervisor-bridge-contract');
