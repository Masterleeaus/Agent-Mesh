/**
 * Resumable lifecycle state for the canonical ExecutionGateway.
 *
 * This module owns lifecycle persistence and recovery intent only. Every
 * consequential attempt, retry, and compensation is delegated to the
 * existing gateway, which remains the sole authority/execution/verifier.
 */
export class InMemoryExecutionLifecycleStore {
  #records = new Map();
  #events = new Map();

  async get(company_id, execution_id) {
    const record = this.#records.get(key(company_id, execution_id));
    return record ? clone(record) : null;
  }

  async find(execution_id) {
    for (const record of this.#records.values()) if (record.execution_id === execution_id) return clone(record);
    return null;
  }

  async put(record) {
    const recordKey = key(record.company_id, record.execution_id);
    this.#records.set(recordKey, freezeClone(record));
    return clone(record);
  }

  async append(event) {
    const eventKey = key(event.company_id, event.execution_id);
    const events = this.#events.get(eventKey) ?? [];
    events.push(freezeClone(event));
    this.#events.set(eventKey, events);
    return clone(event);
  }

  async history(company_id, execution_id) {
    return (this.#events.get(key(company_id, execution_id)) ?? []).map(clone);
  }
}

export class GovernedExecutionRecovery {
  constructor({ gateway, store = new InMemoryExecutionLifecycleStore(), now = () => new Date().toISOString() } = {}) {
    if (!gateway || typeof gateway.execute !== 'function') throw new Error('execution-gateway-required');
    this.gateway = gateway;
    this.store = store;
    this.now = now;
  }

  async start(request) {
    validateIdentity(request);
    const existing = await this.store.get(request.company_id, request.execution_id);
    if (existing) return existing;
    const record = {
      schema: 'titan.execution.lifecycle/v1',
      execution_id: request.execution_id,
      company_id: request.company_id,
      status: 'READY',
      kind: request.compensation_of ? 'COMPENSATION' : 'PRIMARY',
      attempt: 0,
      parent_execution_id: request.compensation_of ?? null,
      updated_at: this.now(),
    };
    await this.store.put(record);
    await this.store.append({ ...record, type: 'STARTED' });
    return record;
  }

  async resume(execution_id, request) {
    const record = await this.requireRecord(execution_id, request);
    if (isTerminal(record.status)) return { state: record.status, execution_id, company_id: record.company_id, duplicate: true };
    ensureCompany(record, request);
    await this.transition(record, request, 'RESUMED', 'RUNNING');
    return this.executeAttempt(record, request);
  }

  async retry(execution_id, request) {
    const record = await this.requireRecord(execution_id, request);
    ensureCompany(record, request);
    if (isTerminal(record.status)) throw new Error('terminal-execution-cannot-retry');
    if (!['FAILED', 'UNCERTAIN', 'READY'].includes(record.status)) throw new Error(`execution-not-retryable:${record.status}`);
    await this.transition(record, request, 'RETRY_REQUESTED', 'RUNNING', { attempt: record.attempt + 1 });
    return this.executeAttempt(record, request);
  }

  async compensate(execution_id, request) {
    const original = await this.requireRecord(execution_id, request);
    ensureCompany(original, request);
    validateIdentity(request);
    if (request.execution_id === execution_id) throw new Error('compensation-requires-new-execution-id');
    const compensationRequest = { ...request, compensation_of: execution_id };
    const compensation = await this.start(compensationRequest);
    await this.transition(compensation, compensationRequest, 'COMPENSATION_REQUESTED', 'READY', { parent_execution_id: execution_id });
    return this.resume(compensation.execution_id, compensationRequest);
  }

  async get(execution_id, company_id) {
    return this.store.get(company_id, execution_id);
  }

  async history(execution_id, company_id) {
    return this.store.history(company_id, execution_id);
  }

  async requireRecord(execution_id, request) {
    validateIdentity({ ...request, execution_id });
    const record = typeof this.store.find === 'function'
      ? await this.store.find(execution_id)
      : await this.store.get(request.company_id, execution_id);
    if (!record) throw new Error(`execution-not-found:${execution_id}`);
    ensureCompany(record, request);
    return record;
  }

  async transition(record, request, type, status, changes = {}) {
    const next = { ...record, ...changes, status, updated_at: this.now() };
    await this.store.put(next);
    await this.store.append({ ...next, type, request_id: request.execution_id });
    Object.assign(record, next);
    return next;
  }

  async executeAttempt(record, request) {
    try {
      const result = await this.gateway.execute(Object.freeze({ ...request, company_id: record.company_id, execution_id: record.execution_id }));
      const status = result?.state ?? 'UNCERTAIN';
      await this.transition(record, request, 'COMPLETED', status, { attempt: record.attempt + 1, result: clone(result) });
      return result;
    } catch (error) {
      if (/authority|approval|revoked/i.test(String(error?.message ?? error))) {
        await this.transition(record, request, 'AUTHORITY_REVALIDATION_FAILED', 'READY', {
          failure: { code: 'AUTHORITY_REVALIDATION_FAILED', message: String(error?.message ?? error) },
        });
        throw error;
      }
      await this.transition(record, request, 'FAILED', 'FAILED', { attempt: record.attempt + 1, failure: { message: String(error?.message ?? error) } });
      throw error;
    }
  }
}

function key(company_id, execution_id) { return `${company_id}:${execution_id}`; }
function clone(value) { return value == null ? value : structuredClone(value); }
function freezeClone(value) { return Object.freeze(clone(value)); }
function isTerminal(status) { return ['VERIFIED', 'DENIED'].includes(status); }
function validateIdentity(request) {
  for (const field of ['execution_id', 'company_id']) if (!request?.[field]) throw new Error(`missing-${field}`);
}
function ensureCompany(record, request) {
  if (record.company_id !== request.company_id) throw new Error('execution-company-context-mismatch');
}

