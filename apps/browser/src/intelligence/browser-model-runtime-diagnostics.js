'use strict';

const DIAGNOSTICS_SCHEMA = 'titan-code-browser-model-runtime-diagnostics/v1';
const DIAGNOSTICS_VERSION = 1;

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function safeError(error) {
  return {
    code: error && typeof error.code === 'string' ? error.code : null,
    message: error && typeof error.message === 'string' ? error.message : String(error),
  };
}

function healthState({ backendAvailable, queueSaturated, memorySaturated, errors }) {
  if (!backendAvailable) return 'unavailable';
  if (errors.length || queueSaturated || memorySaturated) return 'degraded';
  return 'healthy';
}

class BrowserModelRuntimeDiagnostics {
  constructor({ resourceRouter, scheduler, workingMemory, fallback, rpc, capability, now } = {}) {
    this.resourceRouter = resourceRouter || null;
    this.scheduler = scheduler || null;
    this.workingMemory = workingMemory || null;
    this.fallback = fallback || null;
    this.rpc = rpc || null;
    this.capability = capability || null;
    this.now = typeof now === 'function' ? now : () => Date.now();
  }

  async snapshot({ sessionId } = {}) {
    const errors = [];
    let resource = null;
    let scheduler = null;
    let memory = null;
    let rpc = null;
    let fallback = null;
    let localCapability = null;

    if (this.resourceRouter && typeof this.resourceRouter.profile === 'function') {
      try { resource = clone(await this.resourceRouter.profile()); }
      catch (error) { errors.push({ component: 'resource-router', ...safeError(error) }); }
    }

    if (this.scheduler && typeof this.scheduler.stats === 'function') {
      try { scheduler = clone(this.scheduler.stats()); }
      catch (error) { errors.push({ component: 'scheduler', ...safeError(error) }); }
    }

    if (this.workingMemory && typeof this.workingMemory.snapshot === 'function' && typeof sessionId === 'string' && sessionId.trim()) {
      try { memory = clone(this.workingMemory.snapshot(sessionId.trim())); }
      catch (error) { errors.push({ component: 'working-memory', ...safeError(error) }); }
    }

    if (this.rpc && typeof this.rpc.capabilities === 'function') {
      try { rpc = clone(await this.rpc.capabilities()); }
      catch (error) { errors.push({ component: 'rpc', ...safeError(error) }); }
    }

    if (this.fallback && typeof this.fallback.capabilities === 'function') {
      try { fallback = clone(await this.fallback.capabilities()); }
      catch (error) { errors.push({ component: 'fallback', ...safeError(error) }); }
    } else if (this.fallback) {
      fallback = { present: true };
    }

    if (this.capability) {
      try {
        localCapability = clone(typeof this.capability === 'function' ? await this.capability() : this.capability);
      } catch (error) {
        errors.push({ component: 'capability', ...safeError(error) });
      }
    }

    const routeOrder = resource && Array.isArray(resource.route_order) ? resource.route_order : [];
    const backendAvailable = routeOrder.length > 0 || Boolean(rpc) || Boolean(fallback);
    const queueSaturated = Boolean(scheduler && scheduler.max_queue > 0 && scheduler.queued >= scheduler.max_queue);
    const memorySaturated = Boolean(memory && memory.max_bytes > 0 && memory.total_bytes >= memory.max_bytes);
    const health = healthState({ backendAvailable, queueSaturated, memorySaturated, errors });

    return Object.freeze({
      schema: DIAGNOSTICS_SCHEMA,
      version: DIAGNOSTICS_VERSION,
      observed_at_ms: this.now(),
      health,
      backend_available: backendAvailable,
      selected_tier: resource && typeof resource.tier === 'string' ? resource.tier : null,
      route_order: routeOrder.slice(),
      resource,
      scheduler,
      memory,
      rpc,
      fallback,
      local_capability: localCapability,
      pressure: {
        queue_saturated: queueSaturated,
        memory_saturated: memorySaturated,
        thermal_pressure: resource && resource.thermal_pressure || null,
        battery_saver: Boolean(resource && resource.battery_saver),
      },
      errors,
      advisory_only: true,
      authority: false,
      verification_authority: false,
      execution_authority: false,
      canonical_authority: false,
    });
  }
}

module.exports = {
  BrowserModelRuntimeDiagnostics,
  DIAGNOSTICS_SCHEMA,
  DIAGNOSTICS_VERSION,
  healthState,
};
