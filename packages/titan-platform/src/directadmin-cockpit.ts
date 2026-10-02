import type { DirectAdminBridgeContext } from './directadmin-session-bridge.js';
import type { DirectAdminPluginId, DirectAdminProjection } from './directadmin-gateway.js';
import type { DirectAdminApiFetch, GovernedIntentRequest } from './directadmin-plugin.js';

/** One instance per cockpit; all consumers subscribe to invalidation. A channel
 * message only removes local context, never supplies identity or authority. */
export class DirectAdminCockpitSession {
  #context: DirectAdminBridgeContext | null = null;
  #epoch = 0;
  #listeners = new Set<() => void>();
  #expiry: ReturnType<typeof setTimeout> | undefined;
  #channel: BroadcastChannel | undefined;
  #disposed = false;
  constructor(private readonly csrf: () => string, private readonly fetcher: DirectAdminApiFetch = fetch,
    channel?: BroadcastChannel) {
    this.#channel = channel ?? (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('titan-directadmin-context') : undefined);
    if (this.#channel) this.#channel.onmessage = () => this.invalidate(false);
  }
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => { this.#listeners.delete(listener); };
  }
  invalidate(broadcast = true): void {
    this.#epoch++;
    this.#context = null;
    clearTimeout(this.#expiry);
    for (const listener of this.#listeners) { try { listener(); } catch { /* Isolate a broken plugin. */ } }
    if (broadcast) this.#channel?.postMessage('invalidate');
  }
  dispose(): void {
    this.#disposed = true;
    this.invalidate();
    this.#channel?.close();
    this.#listeners.clear();
  }
  private async send(path: string, body?: unknown): Promise<unknown> {
    if (this.#disposed) throw new Error('directadmin-session-disposed');
    const epoch = this.#epoch;
    const csrf = this.csrf();
    if (!/^[A-Za-z0-9_-]{43,128}$/.test(csrf)) throw new Error('directadmin-csrf-missing');
    const response = await this.fetcher(path, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      referrerPolicy: 'same-origin', signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'application/json', 'X-Titan-CSRF': csrf,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (epoch !== this.#epoch) throw new Error('directadmin-context-invalidated');
    if (!response.ok) {
      if ([401, 403, 409].includes(response.status)) this.invalidate();
      throw new Error(`directadmin-http-${response.status}`);
    }
    const result = await response.json();
    if (epoch !== this.#epoch) throw new Error('directadmin-context-invalidated');
    return result;
  }
  private accept(value: DirectAdminBridgeContext): DirectAdminBridgeContext {
    if (value?.schema !== 'titan.directadmin.session/v1' || value.authority !== 'not-carried' ||
        typeof value.actor_id !== 'string' || !value.actor_id || typeof value.company_id !== 'string' || !value.company_id ||
        !Array.isArray(value.company_ids) || value.company_ids.length !== 1 || value.company_ids[0] !== value.company_id ||
        typeof value.context_revision !== 'string' || !value.context_revision ||
        !Number.isSafeInteger(value.session_revision) || value.session_revision < 1 ||
        !Number.isFinite(value.expires_at) || value.expires_at <= Date.now()) {
      this.invalidate(); throw new Error('directadmin-invalid-context');
    }
    if (this.#context && (this.#context.company_id !== value.company_id || this.#context.actor_id !== value.actor_id ||
        this.#context.context_revision !== value.context_revision)) this.invalidate();
    this.#context = Object.freeze({ ...value, company_ids: Object.freeze([...value.company_ids]) });
    clearTimeout(this.#expiry);
    this.#expiry = setTimeout(() => this.invalidate(), Math.min(value.expires_at - Date.now(), 2_147_483_647));
    return this.#context;
  }
  async connect(): Promise<DirectAdminBridgeContext> {
    const epoch = this.#epoch;
    const result = await this.send('/v1/directadmin/context') as DirectAdminBridgeContext;
    if (this.#disposed || epoch !== this.#epoch) throw new Error('directadmin-context-invalidated');
    return this.accept(result);
  }
  async projection(plugin: DirectAdminPluginId): Promise<DirectAdminProjection> {
    if (!['titan_zero', 'titan_operations', 'titan_web', 'titan_workforce'].includes(plugin)) throw new Error('unknown-plugin');
    const epoch = this.#epoch;
    const result = await this.send(`/v1/directadmin/${plugin}/projection`) as { context: DirectAdminBridgeContext; projection: DirectAdminProjection };
    if (this.#disposed || epoch !== this.#epoch) throw new Error('directadmin-context-invalidated');
    const context = this.accept(result.context);
    if (epoch !== this.#epoch || result.projection?.company_id !== context.company_id) throw new Error('directadmin-projection-invalidated');
    return result.projection;
  }
  async intent(plugin: DirectAdminPluginId, intent: GovernedIntentRequest): Promise<unknown> {
    if (!['titan_zero', 'titan_operations', 'titan_web', 'titan_workforce'].includes(plugin) || !this.#context ||
        this.#context.expires_at <= Date.now() || intent.company_id !== this.#context.company_id || intent.actor_id !== this.#context.actor_id) {
      throw new Error('directadmin-intent-context-mismatch');
    }
    return this.send(`/v1/directadmin/${plugin}/intents`, { ...intent, context_revision: this.#context.context_revision });
  }
  async switchCompany(company_id: string): Promise<void> {
    this.invalidate(); // Purge every plugin before waiting for the server, even on failure.
    try { await this.send('/v1/directadmin/company', { company_id }); }
    finally { this.invalidate(); }
  }
  async logout(): Promise<void> {
    this.invalidate();
    try { await this.send('/v1/directadmin/logout', {}); }
    finally { this.invalidate(); }
  }
}

/** Shared accessible renderer: textContent encodes untrusted source strings. */
export function mountDirectAdminProjection(session: DirectAdminCockpitSession, input: {
  plugin_id: DirectAdminPluginId; title: string; root: HTMLElement;
  summarize: (projection: DirectAdminProjection) => string;
}) {
  const doc = input.root.ownerDocument;
  const heading = doc.createElement('h2'); heading.textContent = input.title;
  const status = doc.createElement('p'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const evidence = doc.createElement('pre');
  const refresh = doc.createElement('button'); refresh.type = 'button'; refresh.textContent = 'Refresh';
  input.root.replaceChildren(heading, status, evidence, refresh);
  let generation = 0;
  const clear = () => { generation++; status.textContent = 'Read-only — authenticate current company context'; evidence.textContent = ''; };
  const unsubscribe = session.subscribe(clear);
  const load = async () => {
    const current = ++generation;
    status.textContent = 'Loading'; evidence.textContent = '';
    try {
      const projection = await session.projection(input.plugin_id);
      if (current !== generation) return;
      status.textContent = input.summarize(projection);
      evidence.textContent = `Source: ${projection.source}\nFreshness: ${projection.freshness ?? 'unknown'}\nEvidence: ${projection.evidence_refs.join(', ') || 'unavailable'}`;
    } catch {
      if (current === generation) { status.textContent = 'Read-only — projection unavailable'; evidence.textContent = ''; }
    }
  };
  refresh.addEventListener('click', load);
  clear();
  return { refresh: load, dispose: () => { clear(); unsubscribe(); refresh.removeEventListener('click', load); input.root.replaceChildren(); } };
}
