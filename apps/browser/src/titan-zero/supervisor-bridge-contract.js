'use strict';

const { validateBridgeEnvelope } = require('./bridge-envelope');

const SHA256 = /^[a-f0-9]{64}$/;
const SAFE_TEXT_MAX = 4096;
const MAX_ITEMS = 100;
const SUPERVISOR_CHECKS = Object.freeze([
  'SYNTAX',
  'TESTS',
  'SECURITY',
  'AUTHORITY_BOUNDARY',
  'LINEAGE',
  'MANIFEST',
  'IMPORTS',
  'PROVIDER_BOUNDARY',
  'REPLAY_IDEMPOTENCY',
]);
const SUPERVISOR_VERDICTS = Object.freeze(['PASS', 'PASS_WITH_WARNINGS', 'FAIL', 'REMEDIATION_REQUIRED']);
const SEVERITIES = Object.freeze(['INFO', 'WARNING', 'ERROR', 'BLOCKING']);
const REQUEST_TYPES = new Set(['VERIFY_REQUEST', 'SCAN_REQUEST']);
const RESPONSE_TYPES = new Set(['SUPERVISOR_VERDICT', 'REMEDIATION_REQUEST']);

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
  if (extras.length) fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', `${label} contains unknown fields: ${extras.join(', ')}`);
}

function assertText(value, label, { min = 1, max = SAFE_TEXT_MAX } = {}) {
  if (typeof value !== 'string' || value.length < min || value.length > max || !value.trim()) {
    fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', `${label} must be a bounded non-empty string`);
  }
}

function assertSha(value, label) {
  if (typeof value !== 'string' || !SHA256.test(value)) {
    fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', `${label} must be lowercase SHA-256 hex`);
  }
}

function normalizeArtifact(value) {
  if (!plainObject(value)) fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', 'artifact must be an object');
  assertExactKeys(value, new Set(['name', 'sha256']), 'artifact');
  assertText(value.name, 'artifact.name', { max: 512 });
  assertSha(value.sha256, 'artifact.sha256');
  return Object.freeze({ name: value.name, sha256: value.sha256 });
}

function normalizeStringArray(value, label, { allowEmpty = true, allowedValues = null, maxItems = MAX_ITEMS } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.length > maxItems) {
    fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', `${label} must be an array with at most ${maxItems} entries`);
  }
  const output = value.map((entry, index) => {
    assertText(entry, `${label}[${index}]`, { max: 1024 });
    if (allowedValues && !allowedValues.includes(entry)) {
      fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', `${label}[${index}] is not allowed`);
    }
    return entry;
  });
  if (new Set(output).size !== output.length) {
    fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', `${label} must not contain duplicates`);
  }
  return Object.freeze(output);
}

function normalizeFindings(value) {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) {
    fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', `findings must be an array with at most ${MAX_ITEMS} entries`);
  }
  return Object.freeze(value.map((finding, index) => {
    if (!plainObject(finding)) fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', `findings[${index}] must be an object`);
    assertExactKeys(finding, new Set(['code', 'severity', 'message', 'evidence_ref']), `findings[${index}]`);
    assertText(finding.code, `findings[${index}].code`, { max: 128 });
    if (!SEVERITIES.includes(finding.severity)) fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', `findings[${index}].severity is not allowed`);
    assertText(finding.message, `findings[${index}].message`);
    if (finding.evidence_ref !== undefined) assertText(finding.evidence_ref, `findings[${index}].evidence_ref`, { max: 1024 });
    return Object.freeze({
      code: finding.code,
      severity: finding.severity,
      message: finding.message,
      ...(finding.evidence_ref === undefined ? {} : { evidence_ref: finding.evidence_ref }),
    });
  }));
}

function normalizeRequest(envelope) {
  if (envelope.sender.role !== 'MANAGER' || envelope.recipient.role !== 'SUPERVISOR') {
    fail('ERR_TITAN_CODE_SUPERVISOR_DIRECTION', `${envelope.type} must flow MANAGER -> SUPERVISOR`);
  }
  const payload = envelope.payload;
  assertExactKeys(payload, new Set(['artifact', 'baseline_sha256', 'checks', 'evidence_refs']), envelope.type);
  const artifact = normalizeArtifact(payload.artifact);
  assertSha(payload.baseline_sha256, 'baseline_sha256');
  const checks = normalizeStringArray(payload.checks, 'checks', { allowEmpty: false, allowedValues: SUPERVISOR_CHECKS });
  const evidenceRefs = normalizeStringArray(payload.evidence_refs, 'evidence_refs');
  return Object.freeze({
    kind: 'SUPERVISOR_REQUEST',
    request_type: envelope.type,
    message_id: envelope.message_id,
    correlation_id: envelope.correlation_id,
    idempotency_key: envelope.idempotency_key,
    created_at: envelope.created_at,
    artifact,
    baseline_sha256: payload.baseline_sha256,
    checks,
    evidence_refs: evidenceRefs,
    canonical_authority: false,
  });
}

function normalizeResponse(envelope) {
  if (envelope.sender.role !== 'SUPERVISOR' || envelope.recipient.role !== 'MANAGER') {
    fail('ERR_TITAN_CODE_SUPERVISOR_DIRECTION', `${envelope.type} must flow SUPERVISOR -> MANAGER`);
  }
  if (envelope.authority.verification_verdict !== true) {
    fail('ERR_TITAN_CODE_SUPERVISOR_AUTHORITY', `${envelope.type} requires Supervisor verification authority`);
  }
  const payload = envelope.payload;
  assertExactKeys(payload, new Set([
    'request_message_id',
    'artifact',
    'baseline_sha256',
    'verdict',
    'findings',
    'evidence_refs',
    'required_actions',
  ]), envelope.type);
  assertText(payload.request_message_id, 'request_message_id', { max: 256 });
  if (envelope.causation_id !== payload.request_message_id) {
    fail('ERR_TITAN_CODE_SUPERVISOR_CAUSATION', 'response causation_id must equal request_message_id');
  }
  const artifact = normalizeArtifact(payload.artifact);
  assertSha(payload.baseline_sha256, 'baseline_sha256');
  if (!SUPERVISOR_VERDICTS.includes(payload.verdict)) {
    fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', 'verdict is not allowed');
  }
  const findings = normalizeFindings(payload.findings);
  const evidenceRefs = normalizeStringArray(payload.evidence_refs, 'evidence_refs');
  const requiredActions = normalizeStringArray(payload.required_actions, 'required_actions');
  const hasBlocking = findings.some((finding) => finding.severity === 'BLOCKING');

  if (payload.verdict === 'PASS' && hasBlocking) {
    fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', 'PASS verdict cannot contain BLOCKING findings');
  }
  if (envelope.type === 'REMEDIATION_REQUEST') {
    if (payload.verdict !== 'REMEDIATION_REQUIRED') {
      fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', 'REMEDIATION_REQUEST requires REMEDIATION_REQUIRED verdict');
    }
    if (!hasBlocking || requiredActions.length === 0) {
      fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', 'remediation requires a BLOCKING finding and at least one required action');
    }
  }
  if (envelope.type === 'SUPERVISOR_VERDICT' && payload.verdict === 'REMEDIATION_REQUIRED') {
    fail('ERR_TITAN_CODE_SUPERVISOR_PAYLOAD', 'REMEDIATION_REQUIRED must use REMEDIATION_REQUEST');
  }

  return Object.freeze({
    kind: envelope.type === 'REMEDIATION_REQUEST' ? 'SUPERVISOR_REMEDIATION' : 'SUPERVISOR_VERDICT',
    response_type: envelope.type,
    message_id: envelope.message_id,
    correlation_id: envelope.correlation_id,
    causation_id: envelope.causation_id,
    idempotency_key: envelope.idempotency_key,
    created_at: envelope.created_at,
    request_message_id: payload.request_message_id,
    artifact,
    baseline_sha256: payload.baseline_sha256,
    verdict: payload.verdict,
    findings,
    evidence_refs: evidenceRefs,
    required_actions: requiredActions,
    canonical_authority: false,
  });
}

function normalizeSupervisorBridgeMessage(envelope) {
  const validation = validateBridgeEnvelope(envelope);
  if (!validation.ok) {
    const error = new TypeError(`Invalid Titan Code bridge envelope: ${validation.errors.join('; ')}`);
    error.code = 'ERR_TITAN_CODE_BRIDGE_ENVELOPE';
    error.validationErrors = validation.errors.slice();
    throw error;
  }
  if (REQUEST_TYPES.has(envelope.type)) return normalizeRequest(envelope);
  if (RESPONSE_TYPES.has(envelope.type)) return normalizeResponse(envelope);
  fail('ERR_TITAN_CODE_SUPERVISOR_TYPE', `Unsupported Supervisor bridge message type: ${envelope.type}`);
}

module.exports = {
  SUPERVISOR_CHECKS,
  SUPERVISOR_VERDICTS,
  SEVERITIES,
  normalizeSupervisorBridgeMessage,
};
