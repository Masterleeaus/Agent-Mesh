'use strict';

const BRIDGE_SCHEMA = 'titan-code-bridge-envelope/v1';
const MAX_PAYLOAD_BYTES = 64 * 1024;
const ROLES = new Set(['MANAGER', 'SUPERVISOR', 'LIBRARIAN']);
const SURFACES = new Set(['TITAN_CODE', 'CHATGPT', 'AGENT_MESH']);
const TYPES = new Set([
  'VERIFY_REQUEST',
  'SCAN_REQUEST',
  'SUPERVISOR_VERDICT',
  'REMEDIATION_REQUEST',
  'CLEANUP_REQUEST',
  'CLEANUP_VERDICT',
  'SUPERSESSION_REQUEST',
  'SUPERSESSION_VERDICT',
  'RECONSTRUCTION_REQUEST',
  'RECONSTRUCTION_VERDICT',
  'ACK',
  'ERROR',
]);
const BRIDGE_ID = /^[A-Za-z0-9._:-]{8,128}$/;

function plainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isIsoTimestamp(value) {
  if (typeof value !== 'string' || !value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function validateBoundedId(label, value, errors, { optional = false } = {}) {
  if (optional && (value === undefined || value === null)) return;
  if (typeof value !== 'string' || !BRIDGE_ID.test(value)) errors.push(`${label} is invalid`);
}

function validateParty(label, party, errors) {
  if (!plainObject(party)) {
    errors.push(`${label} must be an object`);
    return;
  }
  if (typeof party.id !== 'string' || !party.id.trim()) errors.push(`${label}.id is required`);
  if (!ROLES.has(party.role)) errors.push(`${label}.role is invalid`);
  if (!SURFACES.has(party.surface)) errors.push(`${label}.surface is invalid`);
}

function validateAuthority(envelope, errors) {
  const authority = envelope.authority;
  if (!plainObject(authority)) {
    errors.push('authority must be an object');
    return;
  }
  if (!ROLES.has(authority.source)) errors.push('authority.source is invalid');
  if (envelope.sender && authority.source !== envelope.sender.role) {
    errors.push('authority.source must match sender.role');
  }
  if (!Array.isArray(authority.scope) || authority.scope.some((v) => typeof v !== 'string' || !v.trim())) {
    errors.push('authority.scope must be an array of non-empty strings');
  }
  for (const key of ['canonical_promotion', 'verification_verdict', 'cleanup_mutation']) {
    if (typeof authority[key] !== 'boolean') errors.push(`authority.${key} must be boolean`);
  }

  if (authority.canonical_promotion === true) {
    errors.push('authority.canonical_promotion must be false on bridge messages');
  }
  if (authority.cleanup_mutation === true) {
    errors.push('authority.cleanup_mutation must be false on bridge messages');
  }
  if (authority.verification_verdict === true && envelope.sender && envelope.sender.role !== 'SUPERVISOR') {
    errors.push('authority.verification_verdict requires SUPERVISOR sender');
  }
  if (envelope.type === 'SUPERVISOR_VERDICT' && authority.verification_verdict !== true) {
    errors.push('SUPERVISOR_VERDICT requires authority.verification_verdict=true');
  }
}

function validateBridgeEnvelope(envelope) {
  const errors = [];
  if (!plainObject(envelope)) return { ok: false, errors: ['envelope must be an object'] };
  if (envelope.schema !== BRIDGE_SCHEMA) errors.push(`schema must equal ${BRIDGE_SCHEMA}`);
  if (typeof envelope.message_id !== 'string' || !/^tcmsg_[A-Za-z0-9._:-]{8,128}$/.test(envelope.message_id)) {
    errors.push('message_id is invalid');
  }
  validateBoundedId('correlation_id', envelope.correlation_id, errors);
  validateBoundedId('causation_id', envelope.causation_id, errors, { optional: true });
  validateBoundedId('idempotency_key', envelope.idempotency_key, errors);
  if (!TYPES.has(envelope.type)) errors.push('type is invalid');
  validateParty('sender', envelope.sender, errors);
  validateParty('recipient', envelope.recipient, errors);
  if (envelope.sender && envelope.recipient && envelope.sender.role === envelope.recipient.role && envelope.sender.id === envelope.recipient.id) {
    errors.push('sender and recipient cannot be identical');
  }
  validateAuthority(envelope, errors);
  if (!isIsoTimestamp(envelope.created_at)) errors.push('created_at must be canonical ISO-8601 UTC');
  if (!plainObject(envelope.payload)) errors.push('payload must be an object');
  else {
    let bytes = Infinity;
    try { bytes = Buffer.byteLength(JSON.stringify(envelope.payload), 'utf8'); } catch (_) { /* fail closed */ }
    if (bytes > MAX_PAYLOAD_BYTES) errors.push(`payload exceeds ${MAX_PAYLOAD_BYTES} bytes`);
  }
  return { ok: errors.length === 0, errors };
}

function createBridgeEnvelope(input) {
  const envelope = { schema: BRIDGE_SCHEMA, ...input };
  const validation = validateBridgeEnvelope(envelope);
  if (!validation.ok) {
    const error = new TypeError(`Invalid Titan Code bridge envelope: ${validation.errors.join('; ')}`);
    error.code = 'ERR_TITAN_CODE_BRIDGE_ENVELOPE';
    error.validationErrors = validation.errors.slice();
    throw error;
  }
  return Object.freeze({
    ...envelope,
    sender: Object.freeze({ ...envelope.sender }),
    recipient: Object.freeze({ ...envelope.recipient }),
    authority: Object.freeze({ ...envelope.authority, scope: Object.freeze(envelope.authority.scope.slice()) }),
    payload: Object.freeze({ ...envelope.payload }),
  });
}

module.exports = {
  BRIDGE_SCHEMA,
  MAX_PAYLOAD_BYTES,
  ROLES: Object.freeze([...ROLES]),
  SURFACES: Object.freeze([...SURFACES]),
  TYPES: Object.freeze([...TYPES]),
  createBridgeEnvelope,
  validateBridgeEnvelope,
};
