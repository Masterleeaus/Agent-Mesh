import { scoped, assertNestedCompany } from 'workforce-presentation';

/** Ephemeral view state only; canonical runtime and the shared SDK own all data/actions. */
export class WorkforceController {
  #epoch = 0;
  #pending = null;
  constructor(api, onChange = () => {}) {
    this.api = api;
    this.onChange = onChange;
    this.state = { phase: 'loading', context: null, discovery: null, status: null, metadata: null, receipt: null, error: null };
  }
  #set(next) { this.state = { ...this.state, ...next }; this.onChange(this.state); }
  invalidate() {
    this.#epoch++;
    this.#pending = null;
    this.#set({ phase: 'denied', context: null, discovery: null, status: null, metadata: null, receipt: null, error: 'Context changed. Reconnect to load permitted Workforce.' });
  }
  async connect() {
    const epoch = ++this.#epoch;
    this.#pending = null;
    this.#set({ phase: 'loading', context: null, discovery: null, status: null, metadata: null, receipt: null, error: null });
    try {
      const context = await this.api.context();
      if (epoch !== this.#epoch) return;
      if (!context?.company_id || !context.actor_id || !context.session_revision) throw new Error('workforce-context-denied');
      const [discovery, status, metadata] = await Promise.all([this.api.discover(context), this.api.status(context), this.api.metadata(context)]);
      if (epoch !== this.#epoch) return;
      for (const value of [discovery, status]) { scoped(value, context.company_id); assertNestedCompany(value, context.company_id); }
      this.#validateProjection(discovery, status, context.company_id);
      this.#set({ phase: 'ready', context, discovery, status, metadata, receipt: null });
      return epoch;
    } catch (error) { if (epoch === this.#epoch) this.#fail(error); return null; }
  }
  #validateProjection(discovery, status, companyId) {
    const invalid = () => { throw new Error('workforce-projection-invalid'); };
    const strings = value => value === undefined || (Array.isArray(value) && value.every(item => typeof item === 'string' && item.trim()));
    const optionalString = value => value == null || (typeof value === 'string' && value.trim().length > 0);
    if (!Array.isArray(discovery?.workers) || !Array.isArray(status?.work)) throw new Error('workforce-projection-invalid');
    if (discovery.controls !== undefined && (!Array.isArray(discovery.controls) || discovery.controls.some(control =>
      !control || typeof control.action !== 'string' || !control.action.trim() || typeof control.capability_id !== 'string' || !control.capability_id.trim()))) invalid();
    for (const worker of discovery.workers) {
      scoped(worker, companyId);
      if (typeof worker.worker_id !== 'string' || !worker.worker_id || !['digital', 'human'].includes(worker.kind)) throw new Error('workforce-projection-invalid');
      if (!strings(worker.capabilities) || typeof worker.active !== 'boolean') invalid();
      if (!optionalString(worker.role) || !optionalString(worker.tier) ||
          !optionalString(worker.manager_id) || !optionalString(worker.team_id)) invalid();
    }
    for (const item of status.work) {
      scoped(item, companyId);
      if (typeof item.work_id !== 'string' || !item.work_id || typeof item.state !== 'string') throw new Error('workforce-projection-invalid');
      if (!strings(item.context_refs) || !strings(item.evidence_refs) || !strings(item.required_capabilities)) invalid();
      if (!optionalString(item.run_id)) invalid();
    }
  }
  #fail(error, submitted = false) {
    this.#epoch++;
    this.#pending = null;
    const message = String(error?.message ?? '');
    const denied = /401|403|409|denied|expired|revok|context|company-mismatch/.test(message);
    // Never render exception payloads (upstream errors may contain secrets or another company's IDs).
    this.#set({ phase: denied ? 'denied' : 'unavailable', context: null, discovery: null, status: null, metadata: null, receipt: null,
      error: denied ? 'Access or company context changed. Reconnect to revalidate.' : submitted ? 'Request outcome is unknown. Reconnect and inspect canonical work/history before submitting again.' : 'Hosted Workforce is unavailable. Reconnect to retrieve current state.' });
  }
  async submit(action) {
    if (this.state.phase !== 'ready' || this.#pending) return;
    const epoch = this.#epoch;
    const context = this.state.context;
    const pending = { token: Symbol('workforce-submit'), action: structuredClone(action), stage: 'preflight' };
    this.#pending = pending;
    this.#set({ phase: 'submitting', receipt: null, error: null });
    try {
      const current = await this.api.context();
      if (epoch !== this.#epoch) return;
      if (current.company_id !== context.company_id || current.actor_id !== context.actor_id ||
          current.session_revision !== context.session_revision || current.context_revision !== context.context_revision) throw new Error('workforce-context-changed');
      pending.stage = 'control';
      const receipt = await this.api.control(current, pending.action);
      if (epoch !== this.#epoch) return;
      scoped(receipt, context.company_id); assertNestedCompany(receipt, context.company_id);
      pending.stage = 'refresh';
      this.#set({ receipt });
      // Do not optimistically edit canonical status; reload it after a receipt.
      const [status, metadata] = await Promise.all([this.api.status(current), this.api.metadata(current)]);
      if (epoch !== this.#epoch) return;
      scoped(status, context.company_id); assertNestedCompany(status, context.company_id);
      this.#validateProjection(this.state.discovery, status, context.company_id);
      if (this.#pending === pending) this.#pending = null;
      this.#set({ phase: 'ready', status, metadata });
    } catch (error) {
      if (error?.message === 'directadmin-workforce-action-denied' &&
          epoch === this.#epoch && this.#pending === pending) {
        // #1049 classifies this 403 at the shared governed-intent route and
        // retains valid session context. Revalidate before restoring the view;
        // an invalidation/switch makes this operation stale and cannot recover.
        const recoveryEpoch = await this.connect();
        if (recoveryEpoch !== null && recoveryEpoch === this.#epoch && this.state.phase === 'ready') {
          this.#set({ error: 'The host denied that request. Current company data was refreshed; review it before retrying.' });
        }
      } else if (error?.message === 'directadmin-http-403' &&
          pending.stage === 'refresh' && epoch === this.#epoch && this.#pending === pending) {
        // A request was accepted, then the read-only refresh was denied. Do
        // not mislabel it as an action denial or retain cleared company data.
        this.#fail(error, true);
        this.#set({ error: 'A request was submitted, but current state could not be refreshed. Reconnect and inspect canonical history before retrying.' });
      } else {
        if (this.#pending === pending) this.#pending = null;
        if (epoch === this.#epoch) this.#fail(error, true);
      }
    }
  }
}
