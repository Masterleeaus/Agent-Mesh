'use strict';

const FALLBACK_RUNTIME_KIND = 'wasm-cpu';
const DEFAULT_MAX_INPUT_CHARS = 32 * 1024;

function fallbackError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

function clamp(value, fallback, min, max) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function normalizeCapability(capability) {
  if (!capability || typeof capability !== 'object') return {};
  return capability;
}

class BrowserModelFallbackRuntime {
  constructor({ wasm, cpu, capability, maxInputChars } = {}) {
    this.wasm = wasm || null;
    this.cpu = cpu || null;
    this.capability = capability || null;
    this.maxInputChars = clamp(maxInputChars, DEFAULT_MAX_INPUT_CHARS, 1024, 128 * 1024);
  }

  async capabilities() {
    const source = typeof this.capability === 'function' ? await this.capability() : this.capability;
    const caps = normalizeCapability(source);
    return Object.freeze({
      kind: FALLBACK_RUNTIME_KIND,
      wasm: !!(this.wasm && typeof this.wasm.generate === 'function'),
      cpu: !!(this.cpu && typeof this.cpu.generate === 'function'),
      threads: Number.isFinite(caps.threads) ? Math.max(1, Math.floor(caps.threads)) : null,
      simd: caps.simd === true,
      advisory_only: true,
      authority: false,
    });
  }

  async generate(payload, options = {}) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw fallbackError('ERR_BROWSER_MODEL_FALLBACK_INPUT', 'payload must be an object');
    }
    if (typeof payload.prompt !== 'string' || !payload.prompt.trim()) {
      throw fallbackError('ERR_BROWSER_MODEL_FALLBACK_INPUT', 'payload.prompt is required');
    }
    if (payload.prompt.length > this.maxInputChars) {
      throw fallbackError('ERR_BROWSER_MODEL_FALLBACK_INPUT', `prompt exceeds fallback limit ${this.maxInputChars}`);
    }
    if (options.signal && options.signal.aborted) {
      throw fallbackError('ERR_BROWSER_MODEL_FALLBACK_CANCELLED', 'fallback request was cancelled');
    }

    const available = {
      wasm: this.wasm && typeof this.wasm.generate === 'function' ? this.wasm : null,
      cpu: this.cpu && typeof this.cpu.generate === 'function' ? this.cpu : null,
    };
    const requestedOrder = Array.isArray(options.routeOrder) ? options.routeOrder : ['wasm', 'cpu'];
    const candidates = [];
    for (const kind of requestedOrder) {
      if ((kind === 'wasm' || kind === 'cpu') && available[kind] && !candidates.some(([existing]) => existing === kind)) candidates.push([kind, available[kind]]);
    }
    for (const kind of ['wasm', 'cpu']) {
      if (available[kind] && !candidates.some(([existing]) => existing === kind)) candidates.push([kind, available[kind]]);
    }
    if (!candidates.length) {
      throw fallbackError('ERR_BROWSER_MODEL_FALLBACK_UNAVAILABLE', 'no WASM or CPU fallback implementation is available');
    }

    const failures = [];
    for (const [kind, runtime] of candidates) {
      try {
        const response = await runtime.generate(payload, options);
        if (!response || typeof response !== 'object' || typeof response.text !== 'string') {
          throw fallbackError('ERR_BROWSER_MODEL_FALLBACK_RESPONSE', `${kind} runtime returned an invalid response`);
        }
        if (response.authority === true || response.canonical === true || response.plan_advance === true || response.mutation_authorized === true) {
          throw fallbackError('ERR_BROWSER_MODEL_FALLBACK_AUTHORITY', `${kind} runtime attempted to grant authority`);
        }
        return Object.freeze({
          ...response,
          runtime: kind,
          advisory_only: true,
          authority: false,
          resource_profile: options.resourceProfile || null,
        });
      } catch (error) {
        if (options.signal && options.signal.aborted) {
          throw fallbackError('ERR_BROWSER_MODEL_FALLBACK_CANCELLED', 'fallback request was cancelled');
        }
        failures.push({ kind, code: error && error.code || 'ERR_RUNTIME', message: error && error.message || String(error) });
      }
    }

    throw fallbackError('ERR_BROWSER_MODEL_FALLBACK_FAILED', 'all browser fallback runtimes failed', failures);
  }
}

module.exports = {
  BrowserModelFallbackRuntime,
  DEFAULT_MAX_INPUT_CHARS,
  FALLBACK_RUNTIME_KIND,
};
