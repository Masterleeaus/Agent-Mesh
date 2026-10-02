/** Consumer of the actual #1049 browser session. No authentication or fetch implementation. */
export class WorkforceApi {
  #snapshot;
  constructor(session, requestId = () => crypto.randomUUID()) { this.session = session; this.requestId = requestId; }
  async context() { this.#snapshot = null; return this.session.connect(); }
  async #load(context) {
    this.#snapshot ??= this.session.projection('titan_workforce');
    const projection = await this.#snapshot;
    const refs = projection?.evidence_refs;
    const freshness = projection?.freshness;
    if (projection?.company_id !== context.company_id || typeof projection.source !== 'string' || !projection.source.trim() ||
        !(freshness === null || (typeof freshness === 'string' && Number.isFinite(Date.parse(freshness)))) ||
        !Array.isArray(refs) || refs.some(ref => typeof ref !== 'string' || !ref.trim()) ||
        projection.data?.company_id !== context.company_id || projection.data?.discovery?.company_id !== context.company_id ||
        projection.data?.status?.company_id !== context.company_id || projection.data?.schema !== 'titan.workforce-cockpit.v1') {
      throw new Error('workforce-projection-invalid');
    }
    return projection;
  }
  async discover(context) { return (await this.#load(context)).data.discovery; }
  async status(context) { return (await this.#load(context)).data.status; }
  async metadata(context) {
    const projection = await this.#load(context);
    return { source: projection.source, freshness: projection.freshness, evidence_refs: [...projection.evidence_refs] };
  }
  async control(context, action) {
    const discovery = await this.discover(context);
    const supported = new Set(['pause', 'resume', 'cancel', 'reassign', 'escalate', 'revoke']);
    const descriptor = discovery.controls?.find(item => item.action === action.action);
    if (!supported.has(action.action) || typeof descriptor?.capability_id !== 'string' || !descriptor.capability_id ||
        typeof action.work_id !== 'string' || !action.work_id || typeof action.reason !== 'string' || !action.reason.trim()) {
      throw new Error('workforce-control-denied');
    }
    const operation_id = this.requestId(); const correlation_id = this.requestId();
    let receipt;
    try {
      receipt = await this.session.intent('titan_workforce', {
        company_id: context.company_id, actor_id: context.actor_id, capability_id: descriptor.capability_id,
        operation_id, correlation_id, input: { action: action.action, work_id: action.work_id,
          reason: action.reason.slice(0, 2000), ...(action.target_worker_id ? { target_worker_id: action.target_worker_id } : {}) },
      });
    } catch (error) {
      // Scope denial to the governed intent route. A 403 from context or
      // projection reads must never be described as a denied action.
      if (error?.message === 'directadmin-http-403') throw new Error('directadmin-workforce-action-denied');
      throw error;
    }
    this.#snapshot = null;
    // The SDK gateway returns ingress acknowledgement only. Never forward an invented VERIFIED result.
    if (receipt?.status !== 'REQUESTED' || receipt.correlation_id !== correlation_id || typeof receipt.receipt_id !== 'string' || !receipt.receipt_id) throw new Error('workforce-receipt-invalid');
    return { company_id: context.company_id, state: 'REQUESTED', receipt_id: receipt.receipt_id,
      operation_id, correlation_id, work_id: action.work_id, evidence_refs: [] };
  }
}
