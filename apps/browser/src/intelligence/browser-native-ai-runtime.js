'use strict';

const RUNTIME_KIND = 'browser-native-ai';
const RUNTIME_VERSION = 1;
const DEFAULT_ORDER = Object.freeze(['chrome-prompt-api', 'webllm', 'webgpu']);

function nativeError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

function isGenerator(runtime) {
  return !!runtime && typeof runtime.generate === 'function';
}

async function capabilityOf(runtime) {
  if (!runtime) return { available: false };
  if (typeof runtime.capabilities === 'function') {
    const value = await runtime.capabilities();
    return value && typeof value === 'object' ? value : { available: isGenerator(runtime) };
  }
  return { available: isGenerator(runtime) };
}

class BrowserNativeAIRuntime {
  constructor({ promptApi, webllm, webgpu, order = DEFAULT_ORDER } = {}) {
    this.runtimes = Object.freeze({
      'chrome-prompt-api': promptApi || null,
      webllm: webllm || null,
      webgpu: webgpu || null,
    });
    this.order = Object.freeze(Array.from(new Set(order.filter((id) => Object.prototype.hasOwnProperty.call(this.runtimes, id)))));
  }

  async capabilities() {
    const providers = {};
    for (const id of this.order) {
      const runtime = this.runtimes[id];
      let capability;
      try { capability = await capabilityOf(runtime); }
      catch (error) { capability = { available: false, error: error && error.message || String(error) }; }
      providers[id] = Object.freeze({
        available: capability.available !== false && isGenerator(runtime),
        ...capability,
        locality: 'ON_DEVICE',
        cost_class: 'DEVICE_OWNED',
        advisory_only: true,
        authority: false,
      });
    }
    return Object.freeze({
      schema: 'titan-code-browser-native-ai-capabilities/v1',
      kind: RUNTIME_KIND,
      version: RUNTIME_VERSION,
      order: this.order,
      providers: Object.freeze(providers),
      advisory_only: true,
      authority: false,
    });
  }

  async generate(payload, options = {}) {
    if (!payload || typeof payload !== 'object' || typeof payload.prompt !== 'string' || !payload.prompt.trim()) {
      throw nativeError('ERR_BROWSER_NATIVE_AI_INPUT', 'payload.prompt is required');
    }
    if (options.signal && options.signal.aborted) throw nativeError('ERR_BROWSER_NATIVE_AI_CANCELLED', 'browser-native AI request was cancelled');

    const requested = typeof options.runtime === 'string' ? [options.runtime] : this.order;
    const failures = [];
    for (const id of requested) {
      const runtime = this.runtimes[id];
      if (!isGenerator(runtime)) continue;
      let caps;
      try { caps = await capabilityOf(runtime); }
      catch (error) { failures.push({ runtime: id, stage: 'capability', message: error && error.message || String(error) }); continue; }
      if (caps.available === false) continue;
      try {
        const response = await runtime.generate(payload, options);
        if (!response || typeof response !== 'object' || typeof response.text !== 'string') {
          throw nativeError('ERR_BROWSER_NATIVE_AI_RESPONSE', `${id} returned an invalid response`);
        }
        if (response.authority === true || response.canonical === true || response.plan_advance === true || response.mutation_authorized === true || response.execution_authorized === true || response.approved === true || response.verified === true) {
          throw nativeError('ERR_BROWSER_NATIVE_AI_AUTHORITY', `${id} attempted to grant authority`);
        }
        return Object.freeze({
          ...response,
          runtime: id,
          locality: 'ON_DEVICE',
          cost_class: 'DEVICE_OWNED',
          advisory_only: true,
          authority: false,
          execution_authority: false,
          verification_authority: false,
          canonical_authority: false,
        });
      } catch (error) {
        if (options.signal && options.signal.aborted) throw nativeError('ERR_BROWSER_NATIVE_AI_CANCELLED', 'browser-native AI request was cancelled');
        failures.push({ runtime: id, stage: 'generate', code: error && error.code || null, message: error && error.message || String(error) });
      }
    }
    throw nativeError('ERR_BROWSER_NATIVE_AI_UNAVAILABLE', 'no browser-native AI runtime completed the request', failures);
  }
}

module.exports = { BrowserNativeAIRuntime, DEFAULT_ORDER, RUNTIME_KIND, RUNTIME_VERSION };
