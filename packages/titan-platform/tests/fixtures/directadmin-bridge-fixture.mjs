import { tsImport } from 'tsx/esm/api';
import { createIdentitySessionRegistry } from '../../.test-dist/security-boundary.js';
import { DirectAdminSessionBridge } from '../../.test-dist/directadmin-plugin.js';
import { projectZeroCockpit } from '../../.test-dist/zero-cockpit.js';
import { createOperationsHealth } from '../../.test-dist/operations-health.js';
import { createBrandPublication } from '../../.test-dist/brand-publication.js';
const { createSqliteStorage } = await tsImport('@titan-zero/storage', { parentURL: import.meta.url, tsconfig: false });
export const ORIGIN = 'https://panel.example.test';
export const b64 = value => Buffer.from(value).toString('base64url');
export const encode = value => b64(JSON.stringify(value));
export const external = { provider: 'directadmin:node-1', subject: 'host-human-17' };
export const proof = { ...external, session_id: 'session-1', device_id: 'device-1', session_revision: 1 };
export const expected = { company_id: 'company-a', audience: 'titan-directadmin:node-1' };
export const csrf = b64(crypto.getRandomValues(new Uint8Array(32)));

export async function fixture(t, { origin = ORIGIN } = {}) {
  const now = Math.floor(Date.now() / 1000) * 1000;
  let clock = now;
  const storage = createSqliteStorage(':memory:');
  t.after(() => storage.close());
  const registry = await createIdentitySessionRegistry({ storage, storage_role: 'GLOBAL_REGISTRY' });
  await registry.putActor({ actor_id: 'actor-1', status: 'active' }, null);
  await registry.putDevice({ actor_id: 'actor-1', device_id: 'device-1', status: 'active' }, null);
  for (const company_id of ['company-a', 'company-b']) {
    await registry.putCompany({ company_id, status: 'active' }, null);
    await registry.putMembership({ actor_id: 'actor-1', company_id, role: 'member', status: 'active' }, null);
    await registry.putExternalBinding({ ...external, binding_id: `mapping-${company_id}`, company_id, actor_id: 'actor-1', status: 'active' }, null);
  }
  const current = await registry.issueSession({ ...proof, company_id: 'company-a', audience: expected.audience,
    issued_at: new Date(now).toISOString(), expires_at: new Date(now + 3600_000).toISOString() }, new Date(now).toISOString());
  const keys = await crypto.subtle.generateKey('Ed25519', false, ['sign', 'verify']);
  const claims = { iss: external.provider, sub: external.subject, aud: expected.audience, node_id: 'node-1',
    session_id: proof.session_id, device_id: proof.device_id, session_revision: 1, company_id: 'company-a', actor_id: 'actor-1',
    context_revision: current.context_revision, csrf_sha256: b64(await crypto.subtle.digest('SHA-256', Buffer.from(csrf))),
    da_role: 'admin', iat: now / 1000, exp: now / 1000 + 120 };
  const sign = async (patch = {}, header = {}, privateKey = keys.privateKey) => {
    const payload = `${encode({ alg: 'EdDSA', typ: 'titan-da-session+jwt', kid: 'key-1', ...header })}.${encode({ ...claims, ...patch })}`;
    return `${payload}.${b64(await crypto.subtle.sign('Ed25519', privateKey, Buffer.from(payload)))}`;
  };
  const token = await sign();
  const bridge = new DirectAdminSessionBridge({ origin, issuer: external.provider, audience: expected.audience,
    node_id: 'node-1', verification_keys: new Map([['key-1', keys.publicKey]]), registry, now: () => clock });
  const request = (path = '/v1/directadmin/context', options = {}) => {
    const headers = new Headers({ origin, 'sec-fetch-site': 'same-origin', 'x-titan-csrf': csrf,
      cookie: `__Host-titan-da-session=${token}` });
    for (const [k, v] of Object.entries(options.headers ?? {})) {
      if (v === null) headers.delete(k); else headers.set(k, v);
    }
    return new Request(options.url ?? `${origin}${path}`, { method: options.method ?? 'GET', headers,
      ...(options.body === undefined ? {} : { body: options.body }) });
  };
  const effects = [];
  const owners = {
    projection: async (plugin, context) => {
      const company_id = context.company_id;
      const time = new Date(clock).toISOString();
      const data = plugin === 'titan_zero' ? projectZeroCockpit({ company_id, generated_at: time, attention: [] })
        : plugin === 'titan_operations' ? createOperationsHealth({ company_id, observed_at: time, nodes: [] })
        : createBrandPublication({ company_id, publication_id: 'publication-1', site_id: 'site-1', version: 1,
          source_snapshot_hash: 'hash-1', route_manifest: ['/'], created_at: time });
      return { company_id, source: plugin, freshness: time, evidence_refs: [], data };
    },
    requestIntent: async (_plugin, intent, context, revalidate) => {
      const latest = await revalidate(); effects.push({ intent, context: latest }); return { receipt_id: 'receipt-1' };
    },
  };
  return { registry, bridge, request, token, claims, sign, owners, effects, now, setClock: value => { clock = value; } };
}

