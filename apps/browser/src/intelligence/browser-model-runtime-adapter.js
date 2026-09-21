'use strict';

const RUNTIME_KIND = 'browser-model';
const ADAPTER_VERSION = 1;
const DEFAULT_TIMEOUT_MS = 45_000;
const MAX_PROMPT_CHARS = 64 * 1024;

function runtimeError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function assertPlainObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw runtimeError('ERR_BROWSER_MODEL_RUNTIME_INPUT', `${name} must be an object`);
  }
}

function normalizePrompt(input) {
  if (typeof input === 'string') return input;
  assertPlainObject(input, 'request');
  if (typeof input.prompt === 'string') return input.prompt;
  if (Array.isArray(input.messages)) {
    return input.messages.map((message) => {
      if (!message || typeof message !== 'object') return '';
      const role = typeof message.role === 'string' ? message.role : 'user';
      const content = typeof message.content === 'string' ? message.content : '';
      return `${role}: ${content}`;
    }).filter(Boolean).join('\n');
  }
  throw runtimeError('ERR_BROWSER_MODEL_RUNTIME_INPUT', 'request must contain prompt or messages');
}

function assertPrompt(prompt) {
  if (!prompt.trim()) throw runtimeError('ERR_BROWSER_MODEL_RUNTIME_INPUT', 'prompt cannot be empty');
  if (prompt.length > MAX_PROMPT_CHARS) {
    throw runtimeError('ERR_BROWSER_MODEL_RUNTIME_INPUT', `prompt exceeds ${MAX_PROMPT_CHARS} characters`);
  }
}

function safeNumber(value, fallback, min, max) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

class BrowserModelRuntimeAdapter {
  constructor({ rpc, capability, fallback, nativeRuntime, resourceRouter, workingMemory, scheduler, outputVerifier, diagnostics, now, timeoutMs } = {}) {
    if (!rpc || typeof rpc.request !== 'function') {
      throw new TypeError('BrowserModelRuntimeAdapter requires an RPC boundary with request(type, payload, options)');
    }
    this.rpc = rpc;
    this.capability = capability || null;
    this.fallback = fallback || null;
    this.nativeRuntime = nativeRuntime || null;
    this.resourceRouter = resourceRouter || null;
    this.workingMemory = workingMemory || null;
    this.scheduler = scheduler || null;
    this.outputVerifier = outputVerifier || null;
    this.diagnosticsReporter = diagnostics || null;
    this.now = typeof now === 'function' ? now : () => Date.now();
    this.timeoutMs = safeNumber(timeoutMs, DEFAULT_TIMEOUT_MS, 1_000, 5 * 60_000);
  }

  async capabilities() {
    const local = typeof this.capability === 'function'
      ? await this.capability()
      : this.capability;
    const rpcCaps = typeof this.rpc.capabilities === 'function'
      ? await this.rpc.capabilities()
      : null;
    const diagnostics = this.diagnosticsReporter && typeof this.diagnosticsReporter.snapshot === 'function'
      ? await this.diagnosticsReporter.snapshot()
      : null;
    return Object.freeze({
      kind: RUNTIME_KIND,
      version: ADAPTER_VERSION,
      advisory_only: true,
      authority: false,
      local: clone(local) || null,
      rpc: clone(rpcCaps) || null,
      diagnostics: clone(diagnostics) || null,
    });
  }

  async health(options = {}) {
    if (!this.diagnosticsReporter || typeof this.diagnosticsReporter.snapshot !== 'function') {
      return Object.freeze({
        kind: RUNTIME_KIND,
        health: 'unknown',
        advisory_only: true,
        authority: false,
      });
    }
    return this.diagnosticsReporter.snapshot(options);
  }

  async generate(request, options = {}) {
    const prompt = normalizePrompt(request);
    assertPrompt(prompt);
    if (options !== undefined && (typeof options !== 'object' || Array.isArray(options))) {
      throw runtimeError('ERR_BROWSER_MODEL_RUNTIME_INPUT', 'options must be an object');
    }

    const requestId = typeof options.requestId === 'string' && options.requestId.trim()
      ? options.requestId.trim()
      : `browser-model-${this.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const timeoutMs = safeNumber(options.timeoutMs, this.timeoutMs, 1_000, 5 * 60_000);
    const temperature = safeNumber(options.temperature, 0.2, 0, 2);
    const maxTokens = safeNumber(options.maxTokens, 1024, 1, 8192);

    const payload = {
      schema: 'titan-code-browser-model-request/v1',
      request_id: requestId,
      prompt,
      model: typeof options.model === 'string' && options.model.trim() ? options.model.trim() : null,
      temperature,
      max_tokens: maxTokens,
      stream: options.stream === true,
      advisory_only: true,
      authority: false,
      metadata: clone(options.metadata) || {},
    };

    let response;
    let routing = null;
    if (this.resourceRouter && typeof this.resourceRouter.select === 'function') {
      routing = await this.resourceRouter.select({ disableWebGpu: options.disableWebGpu === true, disableWasm: options.disableWasm === true });
    }
    const execute = async () => {
      if (this.nativeRuntime && typeof this.nativeRuntime.generate === 'function' && options.disableNative !== true) {
        try {
          return await this.nativeRuntime.generate(payload, { signal: options.signal, timeoutMs, runtime: options.nativeRuntime });
        } catch (nativeError) {
          if (options.signal && options.signal.aborted) throw runtimeError('ERR_BROWSER_MODEL_RUNTIME_CANCELLED', 'browser model request was cancelled');
          if (options.nativeOnly === true) {
            const wrapped = runtimeError('ERR_BROWSER_MODEL_RUNTIME_NATIVE', 'browser-native model runtime failed', { code: nativeError && nativeError.code || null, message: nativeError && nativeError.message || String(nativeError) });
            wrapped.cause = nativeError;
            throw wrapped;
          }
        }
      }
      const preferPrimary = !routing || routing.order[0] === 'webgpu';
      try {
        if (!preferPrimary) throw runtimeError('ERR_BROWSER_MODEL_RUNTIME_ROUTE_FALLBACK', `resource profile selected ${routing.order[0]} before WebGPU`);
        return await this.rpc.request('INTELLIGENCE_BROWSER_MODEL_GENERATE', payload, {
          signal: options.signal,
          timeoutMs,
        });
      } catch (error) {
        if (options.signal && options.signal.aborted) {
          throw runtimeError('ERR_BROWSER_MODEL_RUNTIME_CANCELLED', 'browser model request was cancelled');
        }
        if (this.fallback && typeof this.fallback.generate === 'function' && options.disableFallback !== true) {
          try {
            return await this.fallback.generate(payload, { signal: options.signal, timeoutMs, routeOrder: routing && routing.order || undefined, resourceProfile: routing && routing.profile || undefined });
          } catch (fallbackError) {
            const wrapped = runtimeError('ERR_BROWSER_MODEL_RUNTIME_FALLBACK', 'browser model RPC and local fallback both failed', {
              rpc: { code: error && error.code || null, message: error && error.message || String(error) },
              fallback: { code: fallbackError && fallbackError.code || null, message: fallbackError && fallbackError.message || String(fallbackError) },
            });
            wrapped.cause = fallbackError;
            throw wrapped;
          }
        }
        const wrapped = runtimeError('ERR_BROWSER_MODEL_RUNTIME_RPC', 'browser model runtime RPC failed');
        wrapped.cause = error;
        throw wrapped;
      }
    };

    if (this.scheduler && typeof this.scheduler.schedule === 'function') {
      response = await this.scheduler.schedule({
        requestId,
        provider: typeof options.provider === 'string' ? options.provider : 'browser-local',
        priority: Number.isFinite(options.priority) ? options.priority : 0,
        signal: options.signal,
        maxWaitMs: options.maxQueueWaitMs,
        task: execute,
      });
    } else {
      response = await execute();
    }

    assertPlainObject(response, 'runtime response');
    if (response.request_id && response.request_id !== requestId) {
      throw runtimeError('ERR_BROWSER_MODEL_RUNTIME_CORRELATION', 'runtime response request_id does not match request');
    }
    if (response.authority === true || response.canonical === true || response.plan_advance === true || response.mutation_authorized === true || response.verified === true || response.approved === true || response.execution_authorized === true) {
      throw runtimeError('ERR_BROWSER_MODEL_RUNTIME_AUTHORITY', 'browser model output cannot grant execution, verification, approval, or governance authority');
    }
    if (typeof response.text !== 'string') {
      throw runtimeError('ERR_BROWSER_MODEL_RUNTIME_RESPONSE', 'runtime response must include text');
    }

    let verified = null;
    if (this.outputVerifier && typeof this.outputVerifier.verify === 'function') {
      try {
        verified = this.outputVerifier.verify(response, { requestId, expectedModel: payload.model, source: 'browser-model-runtime' });
      } catch (error) {
        const wrapped = runtimeError('ERR_BROWSER_MODEL_RUNTIME_VERIFICATION', 'browser model output verification failed', { code: error && error.code || null, message: error && error.message || String(error) });
        wrapped.cause = error;
        throw wrapped;
      }
    }
    const trusted = verified || response;

    if (this.workingMemory && typeof this.workingMemory.put === 'function' && typeof options.sessionId === 'string' && options.sessionId.trim()) {
      this.workingMemory.put(options.sessionId.trim(), {
        key: `model-response:${requestId}`,
        value: { text: trusted.text, model: typeof trusted.model === 'string' ? trusted.model : payload.model },
        provenance: { source: 'browser-model-runtime', request_id: requestId, confidence: Number.isFinite(trusted.confidence) ? trusted.confidence : null, structurally_verified: Boolean(verified) },
        tags: ['model-response','advisory-only'],
      });
    }

    return Object.freeze({
      request_id: requestId,
      text: trusted.text,
      model: typeof trusted.model === 'string' ? trusted.model : payload.model,
      finish_reason: typeof trusted.finish_reason === 'string' ? trusted.finish_reason : null,
      usage: clone(trusted.usage) || null,
      runtime: clone(trusted.runtime) || RUNTIME_KIND,
      confidence: Number.isFinite(trusted.confidence) ? trusted.confidence : null,
      structurally_verified: Boolean(verified),
      advisory_only: true,
      authority: false,
      verification_authority: false,
      execution_authority: false,
      canonical_authority: false,
      raw_metadata: clone(trusted.metadata || response.metadata) || {},
      resource_profile: routing ? clone(routing.profile) : null,
    });
  }
}

function createBrowserModelRuntimeAdapter(options) {
  return new BrowserModelRuntimeAdapter(options);
}

module.exports = {
  ADAPTER_VERSION,
  BrowserModelRuntimeAdapter,
  DEFAULT_TIMEOUT_MS,
  MAX_PROMPT_CHARS,
  RUNTIME_KIND,
  createBrowserModelRuntimeAdapter,
};
