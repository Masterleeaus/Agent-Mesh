'use strict';

const { ModelOutputVerifier } = require('./model-output-verifier');
const { SkillExecutionSandbox } = require('./skill-execution-sandbox');

const SKILL_HOST_RUNTIME_SCHEMA = 'titan-code-skill-intelligence-host-runtime/v1';
const AUTHORITY = Object.freeze({
  advisory_only: true,
  authority: false,
  verification_authority: false,
  execution_authority: false,
  canonical_authority: false,
  mutation_authority: false,
  plan_authority: false,
  provider_authority: false,
});

function fail(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

function clean(value, max = 180) {
  return String(value ?? '').trim().slice(0, max);
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

function normalizeProviderRequest(input = {}, ctx = {}) {
  if (!input || input.enabled !== true) return null;
  const allowCloud = input.allow_cloud === true && input.cloud_authorized === true;
  const preferredProviders = Array.isArray(input.preferred_providers)
    ? input.preferred_providers.map(id => clean(id, 80)).filter(Boolean).slice(0, 8)
    : [];
  const requiredCapabilities = Array.isArray(input.required_capabilities)
    ? input.required_capabilities.map(id => clean(id, 80)).filter(Boolean).slice(0, 16)
    : ['text'];
  return freeze({
    managerId: clean(input.manager_id || ctx.managerId, 120),
    planId: clean(input.plan_id || ctx.planId, 120),
    runId: clean(input.run_id || ctx.runId, 120),
    stepId: clean(input.step_id, 120),
    purpose: clean(input.purpose || 'skill-runtime-assist', 160),
    task: clean(input.task, 8000),
    systemInstructions: clean(input.system_instructions, 8000),
    evidence: Array.isArray(input.evidence) ? clone(input.evidence).slice(0, 32) : [],
    preferredProviders,
    privacy: { allowCloud },
    costPolicy: clone(input.cost_policy) || { mode: 'FREE_ONLY' },
    requiredCapabilities: requiredCapabilities.length ? requiredCapabilities : ['text'],
    retryPolicy: { allowFailover: input.allow_failover !== false },
  });
}

class SkillIntelligenceHostRuntime {
  constructor({ sandbox, verifier, providerGateway = null, now } = {}) {
    if (!(sandbox instanceof SkillExecutionSandbox)) {
      throw fail('ERR_SKILL_HOST_SANDBOX', 'skill host runtime requires SkillExecutionSandbox');
    }
    if (verifier && !(verifier instanceof ModelOutputVerifier)) {
      throw fail('ERR_SKILL_HOST_VERIFIER', 'skill host runtime verifier must be ModelOutputVerifier');
    }
    if (providerGateway && typeof providerGateway.request !== 'function') {
      throw fail('ERR_SKILL_HOST_PROVIDER_GATEWAY', 'provider gateway must expose request()');
    }
    this.sandbox = sandbox;
    this.verifier = verifier || new ModelOutputVerifier();
    this.providerGateway = providerGateway;
    this.now = typeof now === 'function' ? now : () => Date.now();
    this.inflight = new Map();
  }

  capability() {
    return freeze({
      schema: SKILL_HOST_RUNTIME_SCHEMA,
      governed_skill_execution: true,
      existing_intelligence_host_compatible: true,
      local_first_provider_routing: Boolean(this.providerGateway),
      cloud_requires_explicit_authorization: true,
      structured_skill_result_verification: true,
      provider_routing_optional: true,
      ...AUTHORITY,
    });
  }

  async _providerContext(providerInput, ctx, signal) {
    const normalized = normalizeProviderRequest(providerInput, ctx);
    if (!normalized) return null;
    if (!this.providerGateway) throw fail('ERR_SKILL_HOST_PROVIDER_UNAVAILABLE', 'provider routing requested but no existing provider gateway is configured');
    if (signal?.aborted) throw fail('ERR_SKILL_HOST_CANCELLED', 'skill host request cancelled before provider routing');
    const routed = await this.providerGateway.request({ ...normalized, signal });
    if (!routed || routed.ok !== true) {
      throw fail('ERR_SKILL_HOST_PROVIDER_FAILED', 'existing provider gateway could not satisfy skill assist request', {
        reason: routed?.reason || 'provider-request-failed',
      });
    }
    return freeze({
      routed: true,
      provider: clean(routed.provider, 80) || null,
      model: clean(routed.model, 160) || null,
      response: clone(routed.response) || null,
      local_first: normalized.privacy.allowCloud !== true,
      cloud_authorized: normalized.privacy.allowCloud === true,
      advisory_only: true,
      authority: false,
    });
  }

  async execute(ctx, payload = {}) {
    const requestId = clean(ctx?.requestId || payload.requestId, 180);
    if (!requestId) throw fail('ERR_SKILL_HOST_REQUEST_ID', 'host-correlated requestId is required');
    const skillId = clean(payload.skillId || payload.skill_id, 96);
    const skillVersion = clean(payload.version || payload.skillVersion || payload.skill_version || '1', 32) || '1';
    if (!skillId) throw fail('ERR_SKILL_HOST_SKILL_ID', 'skillId is required');
    if (payload.operation && payload.operation !== 'skill.execute') {
      throw fail('ERR_SKILL_HOST_OPERATION', 'unsupported skill host operation', { operation: payload.operation });
    }

    const controller = new AbortController();
    const externalSignal = payload.signal;
    const onAbort = () => controller.abort(externalSignal.reason || 'host-cancelled');
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort(externalSignal.reason || 'host-cancelled');
      else externalSignal.addEventListener('abort', onAbort, { once: true });
    }
    this.inflight.set(requestId, controller);

    try {
      const providerContext = await this._providerContext(payload.provider, ctx || {}, controller.signal);
      const executionInput = freeze({
        input: clone(payload.input),
        provider_context: providerContext,
        host_context: {
          session_id: clean(ctx?.sessionId, 180) || null,
          project_id: clean(ctx?.projectId, 180) || null,
          plan_id: clean(ctx?.planId, 180) || null,
          run_id: clean(ctx?.runId, 180) || null,
        },
      });
      const execution = await this.sandbox.execute({
        requestId,
        skillId,
        version: skillVersion,
        input: executionInput,
        signal: controller.signal,
        budget: payload.budget || {},
      });
      const verified = this.verifier.verifySkillResult(execution.result, {
        requestId,
        skillId,
        skillVersion,
        source: 'skill-intelligence-host-runtime',
      });
      return freeze({
        schema: SKILL_HOST_RUNTIME_SCHEMA,
        request_id: requestId,
        session_id: clean(ctx?.sessionId, 180) || null,
        skill_id: skillId,
        skill_version: skillVersion,
        execution,
        verified_result: verified,
        provider_context: providerContext ? {
          routed: true,
          provider: providerContext.provider,
          model: providerContext.model,
          local_first: providerContext.local_first,
          cloud_authorized: providerContext.cloud_authorized,
        } : null,
        observed_at_ms: this.now(),
        ...AUTHORITY,
      });
    } finally {
      this.inflight.delete(requestId);
      if (externalSignal) externalSignal.removeEventListener('abort', onAbort);
    }
  }

  cancel(requestId, reason = 'cancelled') {
    const id = clean(requestId, 180);
    const controller = this.inflight.get(id);
    if (!controller || controller.signal.aborted) return freeze({ ok: false, request_id: id, ...AUTHORITY });
    controller.abort(reason);
    return freeze({ ok: true, request_id: id, ...AUTHORITY });
  }

  async health() {
    let provider = null;
    if (this.providerGateway && typeof this.providerGateway.status === 'function') {
      try { provider = await Promise.resolve(this.providerGateway.status()); }
      catch (error) { provider = { ok: false, error: clean(error?.message, 240) }; }
    }
    return freeze({
      schema: SKILL_HOST_RUNTIME_SCHEMA,
      ok: true,
      inflight: this.inflight.size,
      provider,
      ...this.capability(),
    });
  }

  asHostRuntime({ id = 'browser-governed-skills' } = {}) {
    const runtimeId = clean(id, 80);
    if (!runtimeId) throw fail('ERR_SKILL_HOST_RUNTIME_ID', 'host runtime id is required');
    return freeze({
      id: runtimeId,
      primaryRuntime: 'browser',
      request: (ctx, payload) => this.execute(ctx, payload),
      stream: async () => { throw fail('ERR_SKILL_HOST_STREAM_UNSUPPORTED', 'governed skill runtime does not expose streaming execution'); },
      embed: async () => { throw fail('ERR_SKILL_HOST_EMBED_UNSUPPORTED', 'governed skill runtime does not expose embeddings'); },
      cancel: (requestId, reason) => this.cancel(requestId, reason),
      listModels: async () => [],
      getCapabilities: async () => this.capability(),
      health: async () => this.health(),
    });
  }
}

module.exports = {
  AUTHORITY,
  SKILL_HOST_RUNTIME_SCHEMA,
  SkillIntelligenceHostRuntime,
  normalizeProviderRequest,
};
