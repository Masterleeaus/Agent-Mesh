import crypto from 'node:crypto';

export const EXECUTION_CLASSES = Object.freeze({
  NATIVE: 'native',
  CONNECTED: 'connected',
  OPERATED: 'operated',
});

export const EXECUTION_STATES = Object.freeze({
  SUCCEEDED: 'SUCCEEDED',
  PROVIDER_ACKNOWLEDGED: 'PROVIDER_ACKNOWLEDGED',
  VERIFYING: 'VERIFYING',
  FAILED: 'FAILED',
  DENIED: 'DENIED',
  WAITING_APPROVAL: 'WAITING_APPROVAL',
  WAITING_USER_AUTH: 'WAITING_USER_AUTH',
  WAITING_MFA: 'WAITING_MFA',
});

export class ExecutionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ExecutionError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Canonical bounded-provider execution gateway.
 * Authority is supplied by Titan's Decision/Risk/Authority path; this module
 * never infers authority from tool availability, browser login, or MCP discovery.
 */
export class ExecutionGateway {
  constructor({ providers = [], evidenceSink = async () => {}, now = () => new Date().toISOString(), idempotencyStore } = {}) {
    this.providers = new Map();
    this.evidenceSink = evidenceSink;
    this.now = now;
    this.completed = new Map();
    this.inFlight = new Map();
    this.idempotencyStore = idempotencyStore;
    for (const provider of providers) this.registerProvider(provider);
  }

  registerProvider(provider) {
    if (!provider?.id || !provider?.executionClass || typeof provider.execute !== 'function') {
      throw new ExecutionError('INVALID_PROVIDER', 'Provider requires id, executionClass and execute()');
    }
    this.providers.set(provider.id, provider);
  }

  listProviders() {
    return [...this.providers.values()].map(({ id, executionClass, capabilities = [], health }) => ({
      id, executionClass, capabilities: [...capabilities], health: health ?? 'unknown',
    }));
  }

  async execute(request) {
    validateRequest(request);
    if (request.authority?.status === 'approval_required') return this.waiting(request, EXECUTION_STATES.WAITING_APPROVAL);
    if (request.authority?.status !== 'approved') return this.denied(request, 'AUTHORITY_REQUIRED');
    if (request.risk?.status === 'denied') return this.denied(request, 'RISK_DENIED');

    const key = `${request.company_id}:${request.idempotency_key}`;
    const fingerprint = crypto.createHash('sha256').update(JSON.stringify([request.capability, request.input ?? null])).digest('hex');
    const prior = this.completed.get(key) ?? await this.idempotencyStore?.get?.(key);
    if (prior) {
      if (prior.fingerprint !== fingerprint) return this.denied(request, 'IDEMPOTENCY_CONFLICT');
      return { ...prior.result, duplicate: true };
    }
    if (this.inFlight.has(key)) {
      const pending = this.inFlight.get(key);
      if (pending.fingerprint !== fingerprint) return this.denied(request, 'IDEMPOTENCY_CONFLICT');
      return { ...await pending.promise, duplicate: true };
    }

    const promise = this.executeOnce(request, key, fingerprint);
    this.inFlight.set(key, { fingerprint, promise });
    try { return await promise; } finally { this.inFlight.delete(key); }
  }

  async executeOnce(request, key, fingerprint) {
    const provider = this.selectProvider(request);
    const startedAt = this.now();
    try {
      const raw = await provider.execute(Object.freeze({ ...request }));
      if ([EXECUTION_STATES.WAITING_MFA, EXECUTION_STATES.WAITING_USER_AUTH, EXECUTION_STATES.WAITING_APPROVAL].includes(raw?.state)) {
        return this.record(request, provider, raw.state, raw, startedAt);
      }
      if (raw?.state === EXECUTION_STATES.FAILED || raw?.isError === true) throw new ExecutionError('PROVIDER_FAILURE', 'Provider reported failure');
      if (typeof provider.verify !== 'function') throw new ExecutionError('VERIFIER_REQUIRED', 'An independent post-action verifier is required');
      const verification = await provider.verify(raw, request);
      if (verification !== true && verification?.verified !== true) throw new ExecutionError('OUTCOME_UNVERIFIED', 'Provider interaction completed but business outcome was not verified');
      const result = await this.record(request, provider, EXECUTION_STATES.SUCCEEDED, { ...raw, verification: verification === true ? raw?.verification : verification }, startedAt);
      const completed = { fingerprint, result };
      await this.idempotencyStore?.set?.(key, completed);
      this.completed.set(key, completed);
      return result;
    } catch (error) {
      const failure = { code: error?.code ?? 'PROVIDER_FAILURE', message: String(error?.message ?? error) };
      return this.record(request, provider, EXECUTION_STATES.FAILED, { failure }, startedAt);
    }
  }

  selectProvider(request) {
    const candidates = [...this.providers.values()].filter((provider) =>
      (provider.capabilities ?? []).includes(request.capability) &&
      (!provider.company_id || provider.company_id === request.company_id) &&
      provider.enabled !== false
    );
    if (!candidates.length) throw new ExecutionError('NO_PROVIDER', `No provider for ${request.capability}`);
    const preference = request.preferred_execution_classes ?? [EXECUTION_CLASSES.NATIVE, EXECUTION_CLASSES.CONNECTED, EXECUTION_CLASSES.OPERATED];
    candidates.sort((a, b) => preference.indexOf(a.executionClass) - preference.indexOf(b.executionClass));
    return candidates[0];
  }

  waiting(request, state) { return { execution_id: request.execution_id, company_id: request.company_id, state, capability: request.capability }; }
  denied(request, code) { return { execution_id: request.execution_id, company_id: request.company_id, state: EXECUTION_STATES.DENIED, capability: request.capability, failure: { code } }; }

  async record(request, provider, state, payload, startedAt) {
    const evidence = {
      evidence_id: crypto.randomUUID(), execution_id: request.execution_id, company_id: request.company_id,
      work_id: request.work_id ?? null, agent_id: request.agent_id ?? null, capability: request.capability,
      run_id: request.run_id ?? null, decision_id: request.decision_id ?? request.authority?.decision_id ?? null,
      request_digest: crypto.createHash('sha256').update(JSON.stringify([request.capability, request.input ?? null])).digest('hex'),
      provider: provider.id, execution_class: provider.executionClass, state, started_at: startedAt, finished_at: this.now(),
      external_ref: payload?.external_ref ?? null, verification: payload?.verification ?? null,
      failure: payload?.failure ?? null,
    };
    await this.evidenceSink(evidence);
    return { execution_id: request.execution_id, company_id: request.company_id, state, capability: request.capability, provider: provider.id, execution_class: provider.executionClass, evidence };
  }
}

function validateRequest(request) {
  for (const field of ['execution_id', 'company_id', 'capability', 'idempotency_key']) {
    if (!request?.[field]) throw new ExecutionError('INVALID_REQUEST', `Missing ${field}`);
  }
  if (request.credential && typeof request.credential !== 'object') throw new ExecutionError('RAW_CREDENTIAL_FORBIDDEN', 'Use a credential handle, never a raw credential');
  if (request.credential?.secret || request.credential?.token || request.credential?.password) throw new ExecutionError('RAW_CREDENTIAL_FORBIDDEN', 'Credential handles must not contain secrets');
}
