/** Consumer of the actual #1049 browser session. No authentication or fetch implementation. */
const REASSIGN_CAPABILITY = 'titan.workforce.reassign';
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
    const skills = projection.data.discovery.skills;
    if (skills !== undefined && (!skills || skills.schema !== 'titan.directadmin.workforce-skills.v1' ||
        skills.company_id !== context.company_id || skills.context_revision !== context.context_revision ||
        skills.read_only !== true || skills.grants_authority !== false ||
        !['available', 'unavailable'].includes(skills.status))) {
      throw new Error('workforce-skills-projection-invalid');
    }
    return projection;
  }
  async discover(context) { return (await this.#load(context)).data.discovery; }
  /** Returns the typed canonical proof projection, or null when connected to an older host. */
  async skills(context) { return (await this.#load(context)).data.discovery.skills ?? null; }
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
    let input = { action: action.action, work_id: action.work_id, reason: action.reason.slice(0, 2000) };
    if (action.action === 'reassign') {
      if (descriptor.capability_id !== REASSIGN_CAPABILITY || descriptor.requires_fresh_approval !== true ||
          descriptor.grants_authority !== false || typeof action.target_worker_id !== 'string' || !action.target_worker_id.trim()) {
        throw new Error('workforce-control-denied');
      }
      const status = await this.status(context);
      const item = status?.work?.find(work => work?.company_id === context.company_id && work.work_id === action.work_id);
      const target = discovery.workers?.find(worker => worker?.company_id === context.company_id && worker.worker_id === action.target_worker_id);
      const required = item?.required_capabilities;
      if (!item || item.state !== 'READY' || (item.assignee != null && (typeof item.assignee !== 'string' || !item.assignee.trim())) ||
          (required !== undefined && (!Array.isArray(required) || required.some(value => typeof value !== 'string' || !value.trim()))) ||
          !target || target.active !== true || target.worker_id === item.assignee ||
          (required?.length && (!Array.isArray(target.capabilities) || required.some(capability => !target.capabilities.includes(capability))))) {
        throw new Error('workforce-control-denied');
      }
      // Bind the request to the assignee from this canonical projection. The
      // owner performs the authoritative READY/assignee CAS and rechecks all
      // authority in its transaction; the browser grants nothing.
      input = { ...input, expected_assignee_id: item.assignee ?? null, target_worker_id: target.worker_id };
    } else if (action.target_worker_id) {
      input = { ...input, target_worker_id: action.target_worker_id };
    }
    const operation_id = this.requestId(); const correlation_id = this.requestId();
    let receipt;
    try {
      receipt = await this.session.intent('titan_workforce', {
        company_id: context.company_id, actor_id: context.actor_id, capability_id: descriptor.capability_id,
        operation_id, correlation_id, input,
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
