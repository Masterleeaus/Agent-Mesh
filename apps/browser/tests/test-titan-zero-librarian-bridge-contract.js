'use strict';

const assert = require('node:assert');
const { createBridgeEnvelope } = require('../src/titan-zero/bridge-envelope');

let normalizeLibrarianBridgeMessage;
try {
  ({ normalizeLibrarianBridgeMessage } = require('../src/titan-zero/librarian-bridge-contract'));
} catch (error) {
  console.error(error);
  process.exit(1);
}

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const manager = { id: 'manager.main', role: 'MANAGER', surface: 'TITAN_CODE' };
const librarian = { id: 'librarian.main', role: 'LIBRARIAN', surface: 'CHATGPT' };
const noAuthority = { source: 'MANAGER', scope: ['lineage.review'], canonical_promotion: false, verification_verdict: false, cleanup_mutation: false };
const libAuthority = { source: 'LIBRARIAN', scope: ['lineage.review'], canonical_promotion: false, verification_verdict: false, cleanup_mutation: false };

function env(type, sender, recipient, authority, payload, extra = {}) {
  return createBridgeEnvelope({
    message_id: extra.message_id || `tcmsg_${type.toLowerCase()}_001`,
    correlation_id: extra.correlation_id || 'corr_library_001',
    causation_id: extra.causation_id,
    idempotency_key: extra.idempotency_key || `idem_${type.toLowerCase()}_001`,
    type,
    sender,
    recipient,
    authority,
    created_at: '2026-09-12T20:45:00.000Z',
    payload,
  });
}

const artifact = { name: 'candidate.zip', sha256: A };
const commonReq = { artifact, baseline_sha256: B, evidence_refs: ['Verification/pass.json'] };

for (const [type, reviewKind] of [
  ['CLEANUP_REQUEST', 'CLEANUP'],
  ['SUPERSESSION_REQUEST', 'SUPERSESSION'],
  ['RECONSTRUCTION_REQUEST', 'RECONSTRUCTION'],
]) {
  const msg = env(type, manager, librarian, noAuthority, {
    ...commonReq,
    review_kind: reviewKind,
    reason: 'Review retained lineage before any Manager action.',
  });
  const normalized = normalizeLibrarianBridgeMessage(msg);
  assert.equal(normalized.kind, 'LIBRARIAN_REQUEST');
  assert.equal(normalized.review_kind, reviewKind);
  assert.equal(normalized.performs_deletion, false);
  assert.equal(normalized.grants_authority, false);
}

for (const [type, reviewKind, decision] of [
  ['CLEANUP_VERDICT', 'CLEANUP', 'ELIGIBLE'],
  ['SUPERSESSION_VERDICT', 'SUPERSESSION', 'SUPERSEDED'],
  ['RECONSTRUCTION_VERDICT', 'RECONSTRUCTION', 'RECONSTRUCTED'],
]) {
  const requestMessageId = `tcmsg_${reviewKind.toLowerCase()}_req_001`;
  const msg = env(type, librarian, manager, libAuthority, {
    request_message_id: requestMessageId,
    artifact,
    baseline_sha256: B,
    review_kind: reviewKind,
    decision,
    retained_lineage_sha256: A,
    evidence_refs: ['Handoffs/evidence.json'],
    reasons: ['Independent Librarian review complete.'],
  }, { causation_id: requestMessageId });
  const normalized = normalizeLibrarianBridgeMessage(msg);
  assert.equal(normalized.kind, 'LIBRARIAN_VERDICT');
  assert.equal(normalized.decision, decision);
  assert.equal(normalized.performs_deletion, false);
  assert.equal(normalized.grants_authority, false);
}

assert.throws(() => normalizeLibrarianBridgeMessage(env('CLEANUP_REQUEST', librarian, manager, libAuthority, {
  ...commonReq, review_kind: 'CLEANUP', reason: 'wrong way',
})), /MANAGER -> LIBRARIAN/);

assert.throws(() => normalizeLibrarianBridgeMessage(env('CLEANUP_VERDICT', librarian, manager, libAuthority, {
  request_message_id: 'tcmsg_cleanup_req_001', artifact, baseline_sha256: B,
  review_kind: 'CLEANUP', decision: 'ELIGIBLE', retained_lineage_sha256: A,
  evidence_refs: [], reasons: ['ok'], delete_paths: ['Archive/old.zip'],
}, { causation_id: 'tcmsg_cleanup_req_001' })), /unknown fields/);

assert.throws(() => normalizeLibrarianBridgeMessage(env('SUPERSESSION_VERDICT', librarian, manager, libAuthority, {
  request_message_id: 'tcmsg_supersession_req_001', artifact, baseline_sha256: B,
  review_kind: 'SUPERSESSION', decision: 'DELETE_NOW', retained_lineage_sha256: A,
  evidence_refs: [], reasons: ['bad decision'],
}, { causation_id: 'tcmsg_supersession_req_001' })), /decision is not allowed/);

assert.throws(() => normalizeLibrarianBridgeMessage(env('RECONSTRUCTION_VERDICT', librarian, manager, libAuthority, {
  request_message_id: 'tcmsg_reconstruct_req_001', artifact, baseline_sha256: B,
  review_kind: 'RECONSTRUCTION', decision: 'RECONSTRUCTED', retained_lineage_sha256: A,
  evidence_refs: [], reasons: ['wrong causation'],
}, { causation_id: 'tcmsg_other_req_001' })), /causation_id/);

console.log('PASS test-titan-zero-librarian-bridge-contract');
