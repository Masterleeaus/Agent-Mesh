import { DirectAdminSessionBridge, DIRECTADMIN_RESPONSE_HEADERS, DIRECTADMIN_CLEAR_SESSION_COOKIE,
  type DirectAdminBridgeContext } from './directadmin-session-bridge.js';
import type { GovernedIntentRequest } from './directadmin-plugin.js';

export type DirectAdminPluginId = 'titan_zero' | 'titan_operations' | 'titan_web';
export type DirectAdminProjection = Readonly<{
  company_id: string; source: string; freshness: string | null;
  evidence_refs: readonly string[]; data: unknown;
}>;

/** Validate the transport envelope at both ingress and browser boundaries. A
 * correctly stamped outer envelope cannot relabel another company's projection. */
export function assertDirectAdminProjection(value: unknown, company_id: string): asserts value is DirectAdminProjection {
  if (!value || typeof value !== 'object') throw new Error('directadmin-invalid-projection');
  const projection = value as DirectAdminProjection;
  const data = projection.data as Record<string, unknown> | null;
  if (projection.company_id !== company_id || !data || typeof data !== 'object' || Array.isArray(data) ||
      data.company_id !== company_id || typeof data.schema !== 'string' || !data.schema ||
      typeof projection.source !== 'string' || !projection.source.trim() || projection.source.length > 1024 ||
      (projection.freshness !== null && (typeof projection.freshness !== 'string' || !Number.isFinite(Date.parse(projection.freshness)))) ||
      !Array.isArray(projection.evidence_refs) || projection.evidence_refs.length > 256 ||
      projection.evidence_refs.some(ref => typeof ref !== 'string' || !ref.trim() || ref.length > 2048)) {
    throw new Error('directadmin-invalid-projection');
  }
}
/** Composition supplies canonical projection owners and governed intent ingress.
 * revalidate MUST be called again by the execution owner at authorization/effect,
 * including queued work. A successful ingress response is only REQUESTED. */
export type DirectAdminGatewayOwners = Readonly<{
  projection: (plugin: DirectAdminPluginId, context: DirectAdminBridgeContext) => Promise<DirectAdminProjection>;
  requestIntent: (plugin: DirectAdminPluginId, intent: GovernedIntentRequest,
    context: DirectAdminBridgeContext, revalidate: () => Promise<DirectAdminBridgeContext>) => Promise<{ receipt_id: string }>;
}>;
const json = (status: number, body: unknown, sessionCookie?: string) => new Response(JSON.stringify(body), {
  status, headers: { ...DIRECTADMIN_RESPONSE_HEADERS, ...(sessionCookie ? { 'set-cookie': sessionCookie } : {}) },
});
async function body(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json' || request.headers.has('content-encoding')) throw new Error('invalid-body');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('missing-body');
  const chunks: Uint8Array[] = [];
  let length = 0;
  let timedOut = false;
  const deadline = setTimeout(() => { timedOut = true; void reader.cancel().catch(() => {}); }, 5000);
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > 65536) throw new Error('body-too-large');
      chunks.push(next.value);
    }
    if (timedOut) throw new Error('body-timeout');
  } finally { clearTimeout(deadline); await reader.cancel(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid-body');
  return parsed;
}

/** Request handler only: launched Workforce/#812 retain server/bootstrap ownership. */
export function createDirectAdminGateway(bridge: DirectAdminSessionBridge, owners: DirectAdminGatewayOwners) {
  let active = 0;
  const handle = async (request: Request): Promise<Response> => {
    let session;
    try { session = await bridge.authenticate(request); }
    catch { return json(401, { error: 'directadmin-session-rejected', read_only: true }); }
    try {
      const url = new URL(request.url);
      if (url.search || url.hash) return json(400, { error: 'invalid-route' });
      const path = url.pathname;
      if (request.method === 'GET' && path === '/v1/directadmin/context') return json(200, session.context);
      if (request.method === 'POST' && path === '/v1/directadmin/logout') {
        await session.logout();
        return json(200, { status: 'reauthentication-required' }, DIRECTADMIN_CLEAR_SESSION_COOKIE);
      }
      if (request.method === 'POST' && path === '/v1/directadmin/company') {
        const input = await body(request);
        if (typeof input.company_id !== 'string' || Object.keys(input).length !== 1) return json(400, { error: 'invalid-company-selection' });
        const switched = await session.switchCompany(input.company_id);
        return json(200, { status: 'context-changed' }, switched.set_cookie);
      }
      const route = /^\/v1\/directadmin\/(titan_zero|titan_operations|titan_web)\/(projection|intents)$/.exec(path);
      if (!route) return json(404, { error: 'unknown-plugin-route' });
      const plugin = route[1] as DirectAdminPluginId;
      if (request.method === 'GET' && route[2] === 'projection') {
        const context = await session.revalidate();
        const projection = await owners.projection(plugin, context);
        assertDirectAdminProjection(projection, context.company_id);
        await session.revalidate(); // suppress an in-flight response after a switch/revocation
        return json(200, { context, projection });
      }
      if (request.method === 'POST' && route[2] === 'intents') {
        const input = await body(request);
        const context = await session.revalidate();
        if (input.company_id !== context.company_id || input.actor_id !== context.actor_id ||
            input.context_revision !== context.context_revision ||
            !['capability_id', 'operation_id', 'correlation_id'].every(k => typeof input[k] === 'string' && /^[A-Za-z0-9:._-]{1,200}$/.test(input[k] as string)) ||
            !input.input || typeof input.input !== 'object' || Array.isArray(input.input) ||
            Object.keys(input).some(k => !['company_id','actor_id','context_revision','capability_id','operation_id','correlation_id','input'].includes(k))) {
          return json(409, { error: 'intent-context-mismatch' });
        }
        const intent: GovernedIntentRequest = Object.freeze({ company_id: context.company_id, actor_id: context.actor_id,
          capability_id: input.capability_id as string, operation_id: input.operation_id as string,
          correlation_id: input.correlation_id as string, input: input.input as Record<string, unknown> });
        const receipt = await owners.requestIntent(plugin, intent, context, session.revalidate);
        return json(202, { status: 'REQUESTED', receipt_id: receipt.receipt_id, correlation_id: intent.correlation_id });
      }
      return json(405, { error: 'method-not-allowed' });
    } catch (error) {
      // Never return exception messages, cookies, credentials or arbitrary provider diagnostics.
      if (error instanceof Error && error.message === 'directadmin-session-rejected') {
        return json(401, { error: 'directadmin-session-rejected', read_only: true });
      }
      return json(503, { error: 'directadmin-context-or-owner-unavailable', read_only: true });
    }
  };
  return async (request: Request): Promise<Response> => {
    if (active >= 32) return json(503, { error: 'directadmin-busy', read_only: true });
    active++;
    try { return await handle(request); } finally { active--; }
  };
}
