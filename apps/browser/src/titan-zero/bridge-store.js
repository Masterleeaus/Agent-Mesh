'use strict';

const { validateBridgeEnvelope } = require('./bridge-envelope');

const STORE_KEY = 'titan_code_bridge_replay_v1';
const STORE_VERSION = 1;
const STATES = new Set(['PENDING', 'COMPLETED']);
const SAFE_ID = /^[A-Za-z0-9._:-]{8,128}$/;

function plainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function bridgeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!plainObject(value)) return value;
  const output = {};
  for (const key of Object.keys(value).sort()) output[key] = canonicalize(value[key]);
  return output;
}

function semanticIdentity(envelope) {
  return canonicalize({
    schema: envelope.schema,
    correlation_id: envelope.correlation_id,
    causation_id: envelope.causation_id || null,
    type: envelope.type,
    sender: envelope.sender,
    recipient: envelope.recipient,
    authority: envelope.authority,
    payload: envelope.payload,
  });
}

async function sha256Hex(value) {
  const text = JSON.stringify(value);
  let cryptoObject = globalThis.crypto;
  if (!cryptoObject || !cryptoObject.subtle) {
    cryptoObject = require('node:crypto').webcrypto;
  }
  const digest = await cryptoObject.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function validatePersistedRecord(record) {
  if (!plainObject(record)) return false;
  if (typeof record.message_id !== 'string' || !/^tcmsg_[A-Za-z0-9._:-]{8,128}$/.test(record.message_id)) return false;
  if (typeof record.correlation_id !== 'string' || !SAFE_ID.test(record.correlation_id)) return false;
  if (typeof record.idempotency_key !== 'string' || !SAFE_ID.test(record.idempotency_key)) return false;
  if (typeof record.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(record.fingerprint)) return false;
  if (!STATES.has(record.state)) return false;
  if (record.state === 'COMPLETED' && !Object.prototype.hasOwnProperty.call(record, 'result')) return false;
  return true;
}

class BridgeReplayStore {
  constructor({ storage, key = STORE_KEY } = {}) {
    if (!storage || typeof storage.get !== 'function' || typeof storage.set !== 'function') {
      throw new TypeError('BridgeReplayStore requires an async storage adapter with get/set');
    }
    this.storage = storage;
    this.key = key;
    this._tail = Promise.resolve();
  }

  async _read() {
    const raw = await this.storage.get(this.key);
    const state = raw && raw[this.key];
    if (state === undefined) return { version: STORE_VERSION, records: [] };
    if (!plainObject(state) || state.version !== STORE_VERSION || !Array.isArray(state.records) || state.records.some((record) => !validatePersistedRecord(record))) {
      throw bridgeError('ERR_TITAN_CODE_BRIDGE_STORE_CORRUPT', 'Titan Code bridge replay state is corrupt or incompatible');
    }
    return clone(state);
  }

  async _write(state) {
    await this.storage.set({ [this.key]: clone(state) });
  }

  _serialize(operation) {
    const run = this._tail.then(operation, operation);
    this._tail = run.then(() => undefined, () => undefined);
    return run;
  }

  async _fingerprint(envelope) {
    const validation = validateBridgeEnvelope(envelope);
    if (!validation.ok) {
      throw bridgeError('ERR_TITAN_CODE_BRIDGE_STORE_ENVELOPE', `Invalid bridge envelope for replay store: ${validation.errors.join('; ')}`);
    }
    return sha256Hex(semanticIdentity(envelope));
  }

  async begin(envelope) {
    const fingerprint = await this._fingerprint(envelope);
    return this._serialize(async () => {
      const state = await this._read();
      const byMessage = state.records.find((record) => record.message_id === envelope.message_id);
      if (byMessage && (byMessage.idempotency_key !== envelope.idempotency_key || byMessage.fingerprint !== fingerprint)) {
        throw bridgeError('ERR_TITAN_CODE_BRIDGE_MESSAGE_ID_CONFLICT', 'Bridge message_id was reused for different logical content');
      }

      const byIdempotency = state.records.find((record) => record.idempotency_key === envelope.idempotency_key);
      if (byIdempotency) {
        if (byIdempotency.fingerprint !== fingerprint) {
          throw bridgeError('ERR_TITAN_CODE_BRIDGE_IDEMPOTENCY_CONFLICT', 'Bridge idempotency_key was reused for different logical content');
        }
        return {
          status: byIdempotency.state === 'COMPLETED' ? 'COMPLETED_REPLAY' : 'PENDING_REPLAY',
          record: clone(byIdempotency),
          result: byIdempotency.state === 'COMPLETED' ? clone(byIdempotency.result) : undefined,
        };
      }

      const record = {
        message_id: envelope.message_id,
        correlation_id: envelope.correlation_id,
        causation_id: envelope.causation_id || null,
        idempotency_key: envelope.idempotency_key,
        fingerprint,
        state: 'PENDING',
      };
      state.records.push(record);
      await this._write(state);
      return { status: 'NEW', record: clone(record) };
    });
  }

  async complete(envelope, result) {
    const fingerprint = await this._fingerprint(envelope);
    return this._serialize(async () => {
      const state = await this._read();
      const record = state.records.find((candidate) => candidate.idempotency_key === envelope.idempotency_key);
      if (!record) throw bridgeError('ERR_TITAN_CODE_BRIDGE_RECORD_MISSING', 'Cannot complete a bridge request that was not admitted');
      if (record.fingerprint !== fingerprint) {
        throw bridgeError('ERR_TITAN_CODE_BRIDGE_IDEMPOTENCY_CONFLICT', 'Completion does not match admitted logical content');
      }
      if (record.state === 'COMPLETED') {
        return { status: 'COMPLETED_REPLAY', record: clone(record), result: clone(record.result) };
      }
      record.state = 'COMPLETED';
      record.result = clone(result);
      await this._write(state);
      return { status: 'COMPLETED', record: clone(record), result: clone(record.result) };
    });
  }

  async getByCorrelation(correlationId) {
    if (typeof correlationId !== 'string' || !SAFE_ID.test(correlationId)) {
      throw bridgeError('ERR_TITAN_CODE_BRIDGE_CORRELATION_ID', 'correlationId is invalid');
    }
    const state = await this._read();
    return clone(state.records.filter((record) => record.correlation_id === correlationId));
  }
}

module.exports = {
  STORE_KEY,
  STORE_VERSION,
  BridgeReplayStore,
  canonicalize,
  semanticIdentity,
  sha256Hex,
};
