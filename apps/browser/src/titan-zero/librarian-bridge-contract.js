'use strict';

const { validateBridgeEnvelope } = require('./bridge-envelope');

const SHA256 = /^[a-f0-9]{64}$/;
const SAFE_TEXT_MAX = 4096;
const MAX_ITEMS = 100;
const REQUEST_TYPES = new Set(['CLEANUP_REQUEST', 'SUPERSESSION_REQUEST', 'RECONSTRUCTION_REQUEST']);
const RESPONSE_TYPES = new Set(['CLEANUP_VERDICT', 'SUPERSESSION_VERDICT', 'RECONSTRUCTION_VERDICT']);
const REVIEW_KIND_BY_TYPE = Object.freeze({
  CLEANUP_REQUEST: 'CLEANUP',
  CLEANUP_VERDICT: 'CLEANUP',
  SUPERSESSION_REQUEST: 'SUPERSESSION',
  SUPERSESSION_VERDICT: 'SUPERSESSION',
  RECONSTRUCTION_REQUEST: 'RECONSTRUCTION',
  RECONSTRUCTION_VERDICT: 'RECONSTRUCTION',
});
const DECISIONS = Object.freeze({
  CLEANUP: Object.freeze(['ELIGIBLE', 'RETAIN', 'BLOCKED']),
  SUPERSESSION: Object.freeze(['SUPERSEDED', 'CURRENT', 'AMBIGUOUS']),
  RECONSTRUCTION: Object.freeze(['RECONSTRUCTED', 'INCOMPLETE', 'CONFLICT']),
});

function plainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function fail(code, message, details) {
  const error = new TypeError(message);
  error.code = code;
  if (details) error.details = details;
  throw error;
}

function assertExactKeys(value, allowed, label) {
  const extras = Object.keys(value).filter((key) => !allowed.has(key));
  if (extras.length) fail('ERR_TITAN_CODE_LIBRARIAN_PAYLOAD', `${label} contains unknown fields: ${extras.join(', ')}`);
}

function assertText(value, label, { min = 1, max = SAFE_TEXT_MAX } = {}) {
  if (typeof value !== 'string' || value.length < min || value.length > max || !value.trim()) {
    fail('ERR_TITAN_CODE_LIBRARIAN_PAYLOAD', `${label} must be a bounded non-empty string`);
  }
}

function assertSha(value, label) {
  if (typeof value !== 'string' || !SHA256.test(value)) {
    fail('ERR_TITAN_CODE_LIBRARIAN_PAYLOAD', `${label} must be lowercase SHA-256 hex`);
  }
}

function normalizeArtifact(value) {
  if (!plainObject(value)) fail('ERR_TITAN_CODE_LIBRARIAN_PAYLOAD', 'artifact must be an object');
  assertExactKeys(value, new Set(['name', 'sha256']), 'artifact');
  assertText(value.name, 'artifact.name', { max: 512 });
  assertSha(value.sha256, 'artifact.sha256');
  return Object.freeze({ name: value.name, sha256: value.sha256 });
}

function normalizeStringArray(value, label, { allowEmpty = true } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.length > MAX_ITEMS) {
    fail('ERR_TITAN_CODE_LIBRARIAN_PAYLOAD', `${label} must be an array with at most ${MAX_ITEMS} entries`);
  }
  const output = value.map((entry, index) => {
    assertText(entry, `${label}[${index}]`, { max: 1024 });
    return entry;
  });
  if (new Set(output).size !== output.length) {
    fail('ERR_TITAN_CODE_LIBRARIAN_PAYLOAD', `${label} must not contain duplicates`);
  }
  return Object.freeze(output);
}

function assertReviewKind(envelope, payload) {
  const expected = REVIEW_KIND_BY_TYPE[envelope.type];
  if (payload.review_kind !== expected) {
    fail('ERR_TITAN_CODE_LIBRARIAN_PAYLOAD', `${envelope.type} requires review_kind=${expected}`);
  }
  return expected;
}

function normalizeRequest(envelope) {
  if (envelope.sender.role !== 'MANAGER' || envelope.recipient.role !== 'LIBRARIAN') {
    fail('ERR_TITAN_CODE_LIBRARIAN_DIRECTION', `${envelope.type} must flow MANAGER -> LIBRARIAN`);
  }
  if (envelope.authority.cleanup_mutation !== false || envelope.authority.canonical_promotion !== false) {
    fail('ERR_TITAN_CODE_LIBRARIAN_AUTHORITY', 'Librarian review requests cannot grant cleanup mutation or canonical authority');
  }
  const payload = envelope.payload;
  assertExactKeys(payload, new Set(['artifact', 'baseline_sha256', 'review_kind', 'reason', 'evidence_refs']), envelope.type);
  const reviewKind = assertReviewKind(envelope, payload);
  const artifact = normalizeArtifact(payload.artifact);
  assertSha(payload.baseline_sha256, 'baseline_sha256');
  assertText(payload.reason, 'reason');
  const evidenceRefs = normalizeStringArray(payload.evidence_refs, 'evidence_refs');
  return Object.freeze({
    kind: 'LIBRARIAN_REQUEST',
    request_type: envelope.type,
    message_id: envelope.message_id,
    correlation_id: envelope.correlation_id,
    idempotency_key: envelope.idempotency_key,
    created_at: envelope.created_at,
    review_kind: reviewKind,
    artifact,
    baseline_sha256: payload.baseline_sha256,
    reason: payload.reason,
    evidence_refs: evidenceRefs,
    grants_authority: false,
    performs_deletion: false,
  });
}

function normalizeResponse(envelope) {
  if (envelope.sender.role !== 'LIBRARIAN' || envelope.recipient.role !== 'MANAGER') {
    fail('ERR_TITAN_CODE_LIBRARIAN_DIRECTION', `${envelope.type} must flow LIBRARIAN -> MANAGER`);
  }
  if (envelope.authority.cleanup_mutation !== false || envelope.authority.canonical_promotion !== false || envelope.authority.verification_verdict !== false) {
    fail('ERR_TITAN_CODE_LIBRARIAN_AUTHORITY', 'Librarian verdicts are evidence only and cannot grant mutation, canonical, or Supervisor authority');
  }
  const payload = envelope.payload;
  assertExactKeys(payload, new Set([
    'request_message_id',
    'artifact',
    'baseline_sha256',
    'review_kind',
    'decision',
    'retained_lineage_sha256',
    'evidence_refs',
    'reasons',
  ]), envelope.type);
  assertText(payload.request_message_id, 'request_message_id', { max: 256 });
  if (envelope.causation_id !== payload.request_message_id) {
    fail('ERR_TITAN_CODE_LIBRARIAN_CAUSATION', 'response causation_id must equal request_message_id');
  }
  const reviewKind = assertReviewKind(envelope, payload);
  const artifact = normalizeArtifact(payload.artifact);
  assertSha(payload.baseline_sha256, 'baseline_sha256');
  assertSha(payload.retained_lineage_sha256, 'retained_lineage_sha256');
  if (!DECISIONS[reviewKind].includes(payload.decision)) {
    fail('ERR_TITAN_CODE_LIBRARIAN_PAYLOAD', 'decision is not allowed');
  }
  const evidenceRefs = normalizeStringArray(payload.evidence_refs, 'evidence_refs');
  const reasons = normalizeStringArray(payload.reasons, 'reasons', { allowEmpty: false });
  return Object.freeze({
    kind: 'LIBRARIAN_VERDICT',
    response_type: envelope.type,
    message_id: envelope.message_id,
    correlation_id: envelope.correlation_id,
    causation_id: envelope.causation_id,
    idempotency_key: envelope.idempotency_key,
    created_at: envelope.created_at,
    request_message_id: payload.request_message_id,
    review_kind: reviewKind,
    artifact,
    baseline_sha256: payload.baseline_sha256,
    retained_lineage_sha256: payload.retained_lineage_sha256,
    decision: payload.decision,
    evidence_refs: evidenceRefs,
    reasons,
    grants_authority: false,
    performs_deletion: false,
  });
}

function normalizeLibrarianBridgeMessage(envelope) {
  const validation = validateBridgeEnvelope(envelope);
  if (!validation.ok) {
    const error = new TypeError(`Invalid Titan Code bridge envelope: ${validation.errors.join('; ')}`);
    error.code = 'ERR_TITAN_CODE_BRIDGE_ENVELOPE';
    error.validationErrors = validation.errors.slice();
    throw error;
  }
  if (REQUEST_TYPES.has(envelope.type)) return normalizeRequest(envelope);
  if (RESPONSE_TYPES.has(envelope.type)) return normalizeResponse(envelope);
  fail('ERR_TITAN_CODE_LIBRARIAN_TYPE', `Unsupported Librarian bridge message type: ${envelope.type}`);
}

module.exports = {
  DECISIONS,
  REVIEW_KIND_BY_TYPE,
  normalizeLibrarianBridgeMessage,
};
