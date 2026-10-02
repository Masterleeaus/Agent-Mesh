import { scoped, assertNestedCompany } from 'workforce-presentation';

/** Ephemeral view state only; canonical runtime and the shared SDK own all data/actions. */
export class WorkforceController {
  #epoch = 0;
  #pending = null;
  constructor(api, onChange = () => {}) {
    this.api = api;
    this.onChange = onChange;
    this.state = { phase: 'loading', context: null, discovery: null, status: null, receipt: null, error: null };
  }
  #set(next) { this.state = { ...this.state, ...next }; this.onChange(this.state); }
  invalidate() {
    this.#epoch++;
    this.#pending = null;
    this.#set({ phase: 'denied', context: null, discovery: null, status: null, receipt: null, error: 'Context changed. Reconnect to load permitted Workforce.' });
  }
  async connect() {
    const epoch = ++this.#epoch;
    this.#pending = null;
    this.#set({ phase: 'loading', context: null, discovery: null, status: null, receipt: null, error: null });
    try {
      const context = await this.api.context();
      if (epoch !== this.#epoch) return;
      if (!context?.company_id || !context.actor_id || !context.session_revision) throw new Error('workforce-context-denied');
      const [discovery, status] = await Promise.all([this.api.discover(context), this.api.status(context)]);
      if (epoch !== this.#epoch) return;
      for (const value of [discovery, status]) { scoped(value, context.company_id); assertNestedCompany(value, context.company_id); }
      this.#validateProjection(discovery, status, context.company_id);
      this.#set({ phase: 'ready', context, discovery, status, receipt: null });
    } catch (error) { if (epoch === this.#epoch) this.#fail(error); }
  }
  #validateProjection(discovery, status, companyId) {
    if (!Array.isArray(discovery?.workers) || !Array.isArray(status?.work)) throw new Error('workforce-projection-invalid');
    for (const worker of discovery.workers) {
      scoped(worker, companyId);
      if (typeof worker.worker_id !== 'string' || !worker.worker_id || !['digital', 'human'].includes(worker.kind)) throw new Error('workforce-projection-invalid');
    }
    for (const item of status.work) {
      scoped(item, companyId);
      if (typeof item.work_id !== 'string' || !item.work_id || typeof item.state !== 'string') throw new Error('workforce-projection-invalid');
    }
  }
  #fail(error, submitted = false) {
    this.#epoch++;
    this.#pending = null;
    const message = String(error?.message ?? '');
    const denied = /401|403|409|denied|expired|revok|context|company-mismatch/.test(message);
    // Never render exception payloads (upstream errors may contain secrets or another company's IDs).
    this.#set({ phase: denied ? 'denied' : 'unavailable', context: null, discovery: null, status: null, receipt: null,
      error: denied ? 'Access or company context changed. Reconnect to revalidate.' : submitted ? 'Request outcome is unknown. Reconnect and inspect canonical work/history before submitting again.' : 'Hosted Workforce is unavailable. Reconnect to retrieve current state.' });
  }
  async submit(action) {
    if (this.state.phase !== 'ready' || this.#pending) return;
    const epoch = this.#epoch;
    const context = this.state.context;
    this.#pending = structuredClone(action);
    this.#set({ phase: 'submitting', receipt: null, error: null });
    try {
      const current = await this.api.context();
      if (epoch !== this.#epoch) return;
      if (current.company_id !== context.company_id || current.actor_id !== context.actor_id ||
          current.session_revision !== context.session_revision || current.context_revision !== context.context_revision) throw new Error('workforce-context-changed');
      const receipt = await this.api.control(current, this.#pending);
      if (epoch !== this.#epoch) return;
      scoped(receipt, context.company_id); assertNestedCompany(receipt, context.company_id);
      this.#set({ receipt });
      // Do not optimistically edit canonical status; reload it after a receipt.
      const status = await this.api.status(current);
      if (epoch !== this.#epoch) return;
      scoped(status, context.company_id); assertNestedCompany(status, context.company_id);
      this.#validateProjection(this.state.discovery, status, context.company_id);
      this.#pending = null;
      this.#set({ phase: 'ready', status });
    } catch (error) {
      if (epoch === this.#epoch) {
        this.#pending = null;
        this.#fail(error, true);
      }
    }
  }
}
