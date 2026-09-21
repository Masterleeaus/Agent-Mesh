'use strict';

const { validateBridgeEnvelope } = require('./bridge-envelope');
const { normalizeSupervisorBridgeMessage } = require('./supervisor-bridge-contract');
const { normalizeLibrarianBridgeMessage } = require('./librarian-bridge-contract');

const OUTBOUND_TYPES = new Set([
  'VERIFY_REQUEST',
  'SCAN_REQUEST',
  'CLEANUP_REQUEST',
  'SUPERSESSION_REQUEST',
  'RECONSTRUCTION_REQUEST',
]);
const INBOUND_SUPERVISOR_TYPES = new Set(['SUPERVISOR_VERDICT', 'REMEDIATION_REQUEST']);
const INBOUND_LIBRARIAN_TYPES = new Set(['CLEANUP_VERDICT', 'SUPERSESSION_VERDICT', 'RECONSTRUCTION_VERDICT']);

function bridgeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function assertEnvelope(envelope) {
  const validation = validateBridgeEnvelope(envelope);
  if (!validation.ok) {
    const error = bridgeError('ERR_TITAN_CODE_BRIDGE_ENVELOPE', `Invalid Titan Code bridge envelope: ${validation.errors.join('; ')}`);
    error.validationErrors = validation.errors.slice();
    throw error;
  }
}

function assertProviderAckSafe(ack) {
  if (!ack || typeof ack !== 'object' || Array.isArray(ack)) {
    throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_PROVIDER_ACK', 'Bridge transport must return an acknowledgement object');
  }
  const forbiddenTruth = [
    'grants_authority',
    'canonical_promotion',
    'verification_verdict',
    'cleanup_mutation',
    'performs_deletion',
  ].some((key) => ack[key] === true);
  if (forbiddenTruth) {
    throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_PROVIDER_AUTHORITY', 'Provider acknowledgement cannot grant governance authority');
  }
}

class ManagerExternalBridge {
  constructor({ store, transport, onSupervisorEvidence, onLibrarianEvidence, now, maxInboundAgeMs, maxFutureSkewMs, activeBaselineSha256 } = {}) {
    if (!store || typeof store.begin !== 'function' || typeof store.complete !== 'function') {
      throw new TypeError('ManagerExternalBridge requires a replay store with begin/complete');
    }
    this.store = store;
    this.transport = transport || null;
    this.onSupervisorEvidence = typeof onSupervisorEvidence === 'function' ? onSupervisorEvidence : null;
    this.onLibrarianEvidence = typeof onLibrarianEvidence === 'function' ? onLibrarianEvidence : null;
    this.now = typeof now === 'function' ? now : () => Date.now();
    this.maxInboundAgeMs = Number.isFinite(maxInboundAgeMs) ? maxInboundAgeMs : 15 * 60 * 1000;
    this.maxFutureSkewMs = Number.isFinite(maxFutureSkewMs) ? maxFutureSkewMs : 30 * 1000;
    this.activeBaselineSha256 = activeBaselineSha256 || null;
  }

  _activeBaseline() {
    return typeof this.activeBaselineSha256 === 'function'
      ? this.activeBaselineSha256()
      : this.activeBaselineSha256;
  }

  _assertInboundFreshnessAndBaseline(envelope) {
    const createdAt = Date.parse(envelope.created_at);
    const now = Number(this.now());
    if (!Number.isFinite(createdAt) || !Number.isFinite(now)) {
      throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_CLOCK', 'Bridge clock or response timestamp is invalid');
    }
    const age = now - createdAt;
    if (age > this.maxInboundAgeMs) {
      throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_STALE_RESPONSE', 'Inbound external evidence is older than the allowed response age');
    }
    if (createdAt - now > this.maxFutureSkewMs) {
      throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_FUTURE_RESPONSE', 'Inbound external evidence is too far in the future');
    }

    const activeBaseline = this._activeBaseline();
    if (activeBaseline !== null && activeBaseline !== undefined) {
      if (typeof activeBaseline !== 'string' || !/^[a-f0-9]{64}$/.test(activeBaseline)) {
        throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_BASELINE_CONFIG', 'Active baseline SHA-256 is invalid');
      }
      const evidenceBaseline = envelope.payload && envelope.payload.baseline_sha256;
      if (evidenceBaseline !== activeBaseline) {
        throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_BASELINE_MISMATCH', 'Inbound external evidence does not match the active baseline');
      }
    }
  }

  _normalizeOutbound(envelope) {
    assertEnvelope(envelope);
    if (!OUTBOUND_TYPES.has(envelope.type) || envelope.sender.role !== 'MANAGER') {
      throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_DIRECTION', 'Outbound Manager bridge traffic must be a Manager request');
    }
    if (envelope.recipient.role === 'SUPERVISOR') return normalizeSupervisorBridgeMessage(envelope);
    if (envelope.recipient.role === 'LIBRARIAN') return normalizeLibrarianBridgeMessage(envelope);
    throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_DIRECTION', 'Outbound Manager bridge request must target Supervisor or Librarian');
  }

  _normalizeInbound(envelope) {
    assertEnvelope(envelope);
    if (envelope.recipient.role !== 'MANAGER') {
      throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_DIRECTION', 'Inbound external bridge evidence must target Manager');
    }
    if (INBOUND_SUPERVISOR_TYPES.has(envelope.type) && envelope.sender.role === 'SUPERVISOR') {
      return { role: 'SUPERVISOR', normalized: normalizeSupervisorBridgeMessage(envelope) };
    }
    if (INBOUND_LIBRARIAN_TYPES.has(envelope.type) && envelope.sender.role === 'LIBRARIAN') {
      return { role: 'LIBRARIAN', normalized: normalizeLibrarianBridgeMessage(envelope) };
    }
    throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_DIRECTION', 'Inbound bridge traffic is not an allowed Supervisor/Librarian response');
  }

  async dispatch(envelope) {
    const normalized = this._normalizeOutbound(envelope);
    if (!this.transport || typeof this.transport.send !== 'function') {
      throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_TRANSPORT', 'No governed external bridge transport is configured');
    }

    const admission = await this.store.begin(envelope);
    if (admission.status === 'COMPLETED_REPLAY') {
      return Object.freeze({ ...clone(admission.result), status: 'COMPLETED_REPLAY' });
    }
    if (admission.status === 'PENDING_REPLAY') {
      return Object.freeze({ status: 'PENDING_REPLAY', message_id: envelope.message_id, grants_authority: false });
    }

    const providerAck = await this.transport.send(envelope);
    assertProviderAckSafe(providerAck);
    const result = Object.freeze({
      status: 'DISPATCHED',
      message_id: envelope.message_id,
      correlation_id: envelope.correlation_id,
      request: normalized,
      provider_ack: Object.freeze(clone(providerAck)),
      grants_authority: false,
      canonical_authority: false,
      performs_deletion: false,
    });
    await this.store.complete(envelope, result);
    return result;
  }

  async ingest(envelope) {
    const { role, normalized } = this._normalizeInbound(envelope);
    this._assertInboundFreshnessAndBaseline(envelope);
    const admission = await this.store.begin(envelope);
    if (admission.status === 'COMPLETED_REPLAY') {
      return Object.freeze({ ...clone(admission.result), status: 'COMPLETED_REPLAY' });
    }
    if (admission.status === 'PENDING_REPLAY') {
      return Object.freeze({ status: 'PENDING_REPLAY', message_id: envelope.message_id, grants_authority: false });
    }

    const handler = role === 'SUPERVISOR' ? this.onSupervisorEvidence : this.onLibrarianEvidence;
    const handlerResult = handler ? await handler(normalized, envelope) : { accepted: true };
    if (handlerResult && typeof handlerResult === 'object' && (
      handlerResult.grants_authority === true ||
      handlerResult.canonical_promotion === true ||
      handlerResult.cleanup_mutation === true ||
      handlerResult.performs_deletion === true
    )) {
      throw bridgeError('ERR_TITAN_CODE_MANAGER_BRIDGE_HANDLER_AUTHORITY', 'Evidence handler result cannot grant governance authority');
    }

    const result = Object.freeze({
      status: 'HANDLED',
      message_id: envelope.message_id,
      correlation_id: envelope.correlation_id,
      source_role: role,
      normalized,
      handler_result: Object.freeze(clone(handlerResult || {})),
      grants_authority: false,
      canonical_authority: false,
      performs_deletion: false,
    });
    await this.store.complete(envelope, result);
    return result;
  }
}

module.exports = {
  OUTBOUND_TYPES: Object.freeze([...OUTBOUND_TYPES]),
  INBOUND_SUPERVISOR_TYPES: Object.freeze([...INBOUND_SUPERVISOR_TYPES]),
  INBOUND_LIBRARIAN_TYPES: Object.freeze([...INBOUND_LIBRARIAN_TYPES]),
  ManagerExternalBridge,
};
