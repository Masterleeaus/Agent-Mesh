'use strict';

const MEMORY_SCHEMA = 'titan-code-session-working-memory/v1';
const DEFAULT_MAX_ITEMS = 64;
const DEFAULT_MAX_BYTES = 128 * 1024;
const DEFAULT_MAX_ITEM_BYTES = 16 * 1024;
const DEFAULT_TTL_MS = 30 * 60 * 1000;

function memoryError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function byteLength(value) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

function assertId(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw memoryError('ERR_SESSION_MEMORY_INPUT', `${field} must be a non-empty string`);
  }
  if (value.length > 256 || !/^[A-Za-z0-9._:@\/-]+$/.test(value)) {
    throw memoryError('ERR_SESSION_MEMORY_INPUT', `${field} contains invalid characters or is too long`);
  }
  return value.trim();
}

function normalizeProvenance(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw memoryError('ERR_SESSION_MEMORY_PROVENANCE', 'provenance must be an object');
  }
  const source = assertId(input.source, 'provenance.source');
  const sourceId = input.source_id == null ? null : assertId(input.source_id, 'provenance.source_id');
  const requestId = input.request_id == null ? null : assertId(input.request_id, 'provenance.request_id');
  const confidence = Number.isFinite(input.confidence)
    ? Math.min(1, Math.max(0, input.confidence))
    : null;
  return Object.freeze({
    source,
    source_id: sourceId,
    request_id: requestId,
    confidence,
    advisory_only: true,
    authority: false,
  });
}

class SessionWorkingMemory {
  constructor({ maxItems, maxBytes, maxItemBytes, ttlMs, now } = {}) {
    this.maxItems = Number.isInteger(maxItems) && maxItems > 0 ? Math.min(maxItems, 512) : DEFAULT_MAX_ITEMS;
    this.maxBytes = Number.isInteger(maxBytes) && maxBytes > 0 ? Math.min(maxBytes, 4 * 1024 * 1024) : DEFAULT_MAX_BYTES;
    this.maxItemBytes = Number.isInteger(maxItemBytes) && maxItemBytes > 0 ? Math.min(maxItemBytes, this.maxBytes) : DEFAULT_MAX_ITEM_BYTES;
    this.ttlMs = Number.isFinite(ttlMs) && ttlMs >= 0 ? Math.min(ttlMs, 24 * 60 * 60 * 1000) : DEFAULT_TTL_MS;
    this.now = typeof now === 'function' ? now : () => Date.now();
    this.sessions = new Map();
  }

  _bucket(sessionId) {
    const id = assertId(sessionId, 'session_id');
    if (!this.sessions.has(id)) this.sessions.set(id, []);
    return this.sessions.get(id);
  }

  _prune(bucket) {
    const now = this.now();
    if (this.ttlMs > 0) {
      for (let i = bucket.length - 1; i >= 0; i -= 1) {
        if (now - bucket[i].recorded_at_ms > this.ttlMs) bucket.splice(i, 1);
      }
    }
    while (bucket.length > this.maxItems) bucket.shift();
    let total = bucket.reduce((sum, entry) => sum + entry.size_bytes, 0);
    while (bucket.length && total > this.maxBytes) {
      total -= bucket[0].size_bytes;
      bucket.shift();
    }
  }

  put(sessionId, { key, value, provenance, tags } = {}) {
    const bucket = this._bucket(sessionId);
    const normalizedKey = assertId(key, 'key');
    const normalizedProvenance = normalizeProvenance(provenance);
    const safeValue = clone(value);
    const safeTags = Array.isArray(tags)
      ? Array.from(new Set(tags.filter((tag) => typeof tag === 'string' && tag.trim()).map((tag) => tag.trim()).slice(0, 16)))
      : [];
    const recordedAt = this.now();
    const entry = {
      schema: MEMORY_SCHEMA,
      key: normalizedKey,
      value: safeValue,
      provenance: normalizedProvenance,
      tags: safeTags,
      recorded_at_ms: recordedAt,
      advisory_only: true,
      authority: false,
    };
    const size = byteLength(entry);
    if (size > this.maxItemBytes) {
      throw memoryError('ERR_SESSION_MEMORY_ITEM_TOO_LARGE', `memory item exceeds ${this.maxItemBytes} bytes`, { size_bytes: size });
    }
    entry.size_bytes = size;

    const existing = bucket.findIndex((item) => item.key === normalizedKey);
    if (existing >= 0) bucket.splice(existing, 1);
    bucket.push(Object.freeze(entry));
    this._prune(bucket);
    return this.get(sessionId, normalizedKey);
  }

  get(sessionId, key) {
    const bucket = this._bucket(sessionId);
    this._prune(bucket);
    const normalizedKey = assertId(key, 'key');
    const entry = bucket.find((item) => item.key === normalizedKey);
    return entry ? clone(entry) : null;
  }

  list(sessionId, { tag, limit } = {}) {
    const bucket = this._bucket(sessionId);
    this._prune(bucket);
    const boundedLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, this.maxItems) : this.maxItems;
    return bucket
      .filter((entry) => !tag || entry.tags.includes(tag))
      .slice(-boundedLimit)
      .map((entry) => clone(entry));
  }

  snapshot(sessionId) {
    const items = this.list(sessionId);
    return Object.freeze({
      schema: MEMORY_SCHEMA,
      session_id: assertId(sessionId, 'session_id'),
      item_count: items.length,
      total_bytes: items.reduce((sum, entry) => sum + entry.size_bytes, 0),
      max_items: this.maxItems,
      max_bytes: this.maxBytes,
      ttl_ms: this.ttlMs,
      items,
      advisory_only: true,
      authority: false,
    });
  }

  clear(sessionId) {
    const id = assertId(sessionId, 'session_id');
    const count = this.sessions.get(id)?.length || 0;
    this.sessions.delete(id);
    return count;
  }
}

module.exports = {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_ITEM_BYTES,
  DEFAULT_MAX_ITEMS,
  DEFAULT_TTL_MS,
  MEMORY_SCHEMA,
  SessionWorkingMemory,
  normalizeProvenance,
};
