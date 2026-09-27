'use strict';

const PROFILE_VERSION = 1;
const DEFAULTS = Object.freeze({
  minWebGpuMemoryMb: 768,
  minWasmMemoryMb: 192,
  reserveMemoryMb: 256,
  maxContextTokens: 4096,
  maxConcurrent: 1,
});

function routeError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

function finite(value) {
  return Number.isFinite(value) ? value : null;
}

function clamp(value, fallback, min, max) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function normalizeSignals(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw routeError('ERR_BROWSER_MODEL_RESOURCE_SIGNALS', 'resource signals must be an object');
  }
  const memoryMb = finite(input.memoryMb);
  const availableMemoryMb = finite(input.availableMemoryMb);
  const logicalProcessors = finite(input.logicalProcessors);
  return Object.freeze({
    webgpu: input.webgpu === true,
    wasm: input.wasm !== false,
    cpu: input.cpu !== false,
    memoryMb: memoryMb == null ? null : Math.max(0, memoryMb),
    availableMemoryMb: availableMemoryMb == null ? null : Math.max(0, availableMemoryMb),
    logicalProcessors: logicalProcessors == null ? null : Math.max(1, Math.floor(logicalProcessors)),
    batterySaver: input.batterySaver === true,
    thermalPressure: ['nominal', 'fair', 'serious', 'critical'].includes(input.thermalPressure) ? input.thermalPressure : 'nominal',
    webgpuAdapter: input.webgpuAdapter && typeof input.webgpuAdapter === 'object' ? { ...input.webgpuAdapter } : null,
  });
}

function effectiveMemoryMb(signals) {
  if (signals.availableMemoryMb != null) return signals.availableMemoryMb;
  if (signals.memoryMb != null) return Math.max(0, signals.memoryMb - DEFAULTS.reserveMemoryMb);
  return null;
}

function deriveResourceProfile(input = {}, overrides = {}) {
  const signals = normalizeSignals(input);
  const cfg = {
    minWebGpuMemoryMb: clamp(overrides.minWebGpuMemoryMb, DEFAULTS.minWebGpuMemoryMb, 128, 32768),
    minWasmMemoryMb: clamp(overrides.minWasmMemoryMb, DEFAULTS.minWasmMemoryMb, 64, 16384),
    reserveMemoryMb: clamp(overrides.reserveMemoryMb, DEFAULTS.reserveMemoryMb, 0, 8192),
    maxContextTokens: clamp(overrides.maxContextTokens, DEFAULTS.maxContextTokens, 256, 32768),
    maxConcurrent: clamp(overrides.maxConcurrent, DEFAULTS.maxConcurrent, 1, 8),
  };

  const memory = signals.availableMemoryMb != null
    ? signals.availableMemoryMb
    : signals.memoryMb != null ? Math.max(0, signals.memoryMb - cfg.reserveMemoryMb) : null;
  const thermallyConstrained = signals.thermalPressure === 'serious' || signals.thermalPressure === 'critical';
  const webgpuEligible = signals.webgpu && !signals.batterySaver && !thermallyConstrained && (memory == null || memory >= cfg.minWebGpuMemoryMb);
  const wasmEligible = signals.wasm && signals.thermalPressure !== 'critical' && (memory == null || memory >= cfg.minWasmMemoryMb);
  const cpuEligible = signals.cpu;

  let tier = 'cpu';
  let maxContextTokens = Math.min(cfg.maxContextTokens, 1024);
  let maxConcurrent = 1;
  if (webgpuEligible) {
    tier = 'webgpu';
    maxContextTokens = cfg.maxContextTokens;
    maxConcurrent = Math.min(cfg.maxConcurrent, signals.logicalProcessors && signals.logicalProcessors >= 8 ? 2 : 1);
  } else if (wasmEligible) {
    tier = 'wasm';
    maxContextTokens = Math.min(cfg.maxContextTokens, signals.logicalProcessors && signals.logicalProcessors >= 4 ? 2048 : 1024);
  } else if (!cpuEligible) {
    throw routeError('ERR_BROWSER_MODEL_RESOURCE_UNAVAILABLE', 'no eligible browser-local runtime is available');
  }

  return Object.freeze({
    schema: 'titan-code-browser-model-resource-profile/v1',
    version: PROFILE_VERSION,
    tier,
    route_order: tier === 'webgpu' ? ['webgpu', 'wasm', 'cpu'] : tier === 'wasm' ? ['wasm', 'cpu'] : ['cpu'],
    effective_memory_mb: memory,
    max_context_tokens: maxContextTokens,
    max_concurrent: maxConcurrent,
    battery_saver: signals.batterySaver,
    thermal_pressure: signals.thermalPressure,
    advisory_only: true,
    authority: false,
    signals,
  });
}

class BrowserModelResourceRouter {
  constructor({ probe, profileOverrides } = {}) {
    this.probe = probe || null;
    this.profileOverrides = profileOverrides || {};
  }

  async profile() {
    const raw = typeof this.probe === 'function' ? await this.probe() : this.probe || {};
    return deriveResourceProfile(raw, this.profileOverrides);
  }

  async select({ disableWebGpu = false, disableWasm = false } = {}) {
    const profile = await this.profile();
    const order = profile.route_order.filter((kind) => {
      if (kind === 'webgpu' && disableWebGpu) return false;
      if (kind === 'wasm' && disableWasm) return false;
      return true;
    });
    if (!order.length) throw routeError('ERR_BROWSER_MODEL_RESOURCE_UNAVAILABLE', 'all eligible runtimes are disabled');
    return Object.freeze({ profile, order });
  }
}

module.exports = {
  BrowserModelResourceRouter,
  DEFAULTS,
  PROFILE_VERSION,
  deriveResourceProfile,
  effectiveMemoryMb,
  normalizeSignals,
};
