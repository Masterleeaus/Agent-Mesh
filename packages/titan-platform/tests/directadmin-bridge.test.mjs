import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { tsImport } from 'tsx/esm/api';
import { createIdentitySessionRegistry } from '../.test-dist/security-boundary.js';
import { DirectAdminSessionBridge, createDirectAdminGateway, DirectAdminCockpitSession,
  redactDirectAdminDiagnostics } from '../.test-dist/directadmin-plugin.js';
import { projectZeroCockpit } from '../.test-dist/zero-cockpit.js';
import { createOperationsHealth } from '../.test-dist/operations-health.js';
import { createBrandPublication } from '../.test-dist/brand-publication.js';
const { createSqliteStorage } = await tsImport('@titan-zero/storage', { parentURL: import.meta.url, tsconfig: false });
const { mountZeroCore } = await tsImport('../../../apps/directadmin/zero-core/cockpit.mjs', { parentURL: import.meta.url, tsconfig: false });
const { mountOperationsHub } = await tsImport('../../../apps/directadmin/operations-hub/cockpit.mjs', { parentURL: import.meta.url, tsconfig: false });
const { mountBrandStudio } = await tsImport('../../../apps/directadmin/brand-studio/cockpit.mjs', { parentURL: import.meta.url, tsconfig: false });
const ORIGIN = 'https://panel.example.test';
const b64 = value => Buffer.from(value).toString('base64url');
const encode = value => b64(JSON.stringify(value));
const external = { provider: 'directadmin:node-1', subject: 'host-human-17' };
const proof = { ...external, session_id: 'session-1', device_id: 'device-1', session_revision: 1 };
const expected = { company_id: 'company-a', audience: 'titan-directadmin:node-1' };
const csrf = b64(crypto.getRandomValues(new Uint8Array(32)));

async function fixture(t) {
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
  const bridge = new DirectAdminSessionBridge({ origin: ORIGIN, issuer: external.provider, audience: expected.audience,
    node_id: 'node-1', verification_keys: new Map([['key-1', keys.publicKey]]), registry, now: () => clock });
  const request = (path = '/v1/directadmin/context', options = {}) => {
    const headers = new Headers({ origin: ORIGIN, 'sec-fetch-site': 'same-origin', 'x-titan-csrf': csrf,
      cookie: `__Host-titan-da-session=${token}` });
    for (const [k, v] of Object.entries(options.headers ?? {})) {
      if (v === null) headers.delete(k); else headers.set(k, v);
    }
    return new Request(options.url ?? `${ORIGIN}${path}`, { method: options.method ?? 'GET', headers,
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

for (const role of ['admin', 'reseller', 'user']) test(`signed ${role} maps canonical actor and selected company only`, async t => {
  const f = await fixture(t);
  const signed = await f.sign({ da_role: role });
  const result = await f.bridge.authenticate(f.request(undefined, { headers: { cookie: `__Host-titan-da-session=${signed}`, 'x-titan-company-id': 'company-b', caller_id: 'root' } }));
  assert.equal(result.context.actor_id, 'actor-1'); assert.equal(result.context.company_id, 'company-a');
  assert.deepEqual(result.context.company_ids, ['company-a']); assert.equal(result.context.da_role, role);
  assert.equal(result.context.authority, 'not-carried'); assert.equal(result.context.allowed_company_ids, undefined);
});

for (const [label, patch] of [
  ['issuer', { iss: 'other-issuer' }], ['subject', { sub: 'other-human' }], ['audience', { aud: 'other-service' }],
  ['node', { node_id: 'node-2' }], ['session', { session_id: 'unknown-session' }], ['device', { device_id: 'device-2' }],
  ['revision', { session_revision: 2 }], ['company', { company_id: 'company-b' }], ['actor', { actor_id: 'root' }],
  ['context revision', { context_revision: 'stale' }], ['role', { da_role: 'root' }], ['fractional revision', { session_revision: 1.5 }],
]) test(`signed wrong ${label} is rejected before projection`, async t => {
  const f = await fixture(t); const token = await f.sign(patch);
  await assert.rejects(f.bridge.authenticate(f.request(undefined, { headers: { cookie: `__Host-titan-da-session=${token}` } })), /session-rejected/);
});

test('raw session ID, forged signature, unknown key, algorithm confusion and duplicate cookies fail closed', async t => {
  const f = await fixture(t);
  const parts = f.token.split('.');
  const forged = `${parts[0]}.${encode({ ...f.claims, actor_id: 'root' })}.${parts[2]}`;
  const other = await crypto.subtle.generateKey('Ed25519', false, ['sign','verify']);
  for (const token of ['session-1', forged, await f.sign({}, { kid: 'other' }), await f.sign({}, { alg: 'none' }),
    await f.sign({}, { jku: 'https://attacker.test/keys' }), await f.sign({}, {}, other.privateKey), `${f.token}=`]) {
    await assert.rejects(f.bridge.authenticate(f.request(undefined, { headers: { cookie: `__Host-titan-da-session=${token}` } })), /session-rejected/);
  }
  await assert.rejects(f.bridge.authenticate(f.request(undefined, { headers: { cookie: `__Host-titan-da-session=${f.token}; __Host-titan-da-session=${f.token}` } })), /session-rejected/);
});

for (const [label, headers] of [
  ['missing csrf', { 'x-titan-csrf': null }], ['wrong csrf', { 'x-titan-csrf': 'x'.repeat(43) }],
  ['missing cookie', { cookie: null }], ['wrong origin', { origin: 'https://attacker.test' }],
  ['null origin', { origin: 'null' }], ['missing origin/referrer', { origin: null }],
  ['cross site', { 'sec-fetch-site': 'cross-site' }], ['missing fetch metadata', { 'sec-fetch-site': null }],
]) test(`CSRF protection rejects ${label}`, async t => {
  const f = await fixture(t); await assert.rejects(f.bridge.authenticate(f.request(undefined, { headers })), /session-rejected/);
});

test('browser GET accepts exact same-origin Referer; POST requires Origin', async t => {
  const f = await fixture(t);
  const headers = { origin: null, referer: `${ORIGIN}/CMD_PLUGINS_ADMIN/titan_zero` };
  await f.bridge.authenticate(f.request(undefined, { headers }));
  await assert.rejects(f.bridge.authenticate(f.request(undefined, { headers, method: 'POST' })), /session-rejected/);
  await assert.rejects(f.bridge.authenticate(f.request(undefined, { headers: { ...headers, referer: `${ORIGIN}.attacker.test/` } })), /session-rejected/);
  await assert.rejects(f.bridge.authenticate(f.request(undefined, { url: 'https://attacker.test/v1/directadmin/context' })), /session-rejected/);
});

test('short credential expiry is enforced again on the effect callback', async t => {
  const f = await fixture(t); const auth = await f.bridge.authenticate(f.request());
  f.setClock((f.claims.exp) * 1000); await assert.rejects(auth.revalidate(), /session-rejected/);
  for (const patch of [{ iat: f.claims.iat + 400, exp: f.claims.iat + 450 }, { exp: f.claims.iat + 600 }, { exp: f.claims.iat }]) {
    await assert.rejects(f.bridge.authenticate(f.request(undefined, { headers: { cookie: `__Host-titan-da-session=${await f.sign(patch)}` } })), /session-rejected/);
  }
});

for (const [label, revoke] of [
  ['actor', r => r.putActor({ actor_id: 'actor-1', status: 'revoked' }, 1)],
  ['membership', r => r.putMembership({ actor_id: 'actor-1', company_id: 'company-a', role: 'member', status: 'revoked' }, 1)],
  ['device', r => r.putDevice({ actor_id: 'actor-1', device_id: 'device-1', status: 'revoked' }, 1)],
  ['binding', r => r.putExternalBinding({ ...external, binding_id: 'mapping-company-a', actor_id: 'actor-1', company_id: 'company-a', status: 'revoked' }, 1)],
  ['session', r => r.revokeSession('session-1', 1)],
]) test(`current ${label} revocation invalidates authenticated pending work`, async t => {
  const f = await fixture(t); const auth = await f.bridge.authenticate(f.request());
  await revoke(f.registry); await assert.rejects(auth.revalidate(), /session-rejected/);
});

const intentBody = f => ({ company_id: 'company-a', actor_id: 'actor-1', context_revision: f.claims.context_revision,
  capability_id: 'ops.inspect', operation_id: 'operation-1', correlation_id: 'correlation-1', input: {} });
const post = body => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('gateway preserves canonical intent correlation and only reports REQUESTED', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  const response = await gateway(f.request('/v1/directadmin/titan_operations/intents', post(intentBody(f))));
  assert.equal(response.status, 202); assert.deepEqual(await response.json(), { status: 'REQUESTED', receipt_id: 'receipt-1', correlation_id: 'correlation-1' });
  assert.deepEqual(f.effects[0].context.company_ids, ['company-a']);
  for (const patch of [{ company_id: 'company-b' }, { actor_id: 'root' }, { context_revision: 'old' }, { caller_id: 'root' }]) {
    const r = await gateway(f.request('/v1/directadmin/titan_operations/intents', post({ ...intentBody(f), ...patch })));
    assert.equal(r.status, 409);
  }
  assert.equal(f.effects.length, 1);
});

test('company switch changes canonical revision and old credentials fail for all three plugins', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  const pending = await f.bridge.authenticate(f.request());
  const response = await gateway(f.request('/v1/directadmin/company', post({ company_id: 'company-b' })));
  assert.equal(response.status, 200); assert.match(response.headers.get('set-cookie'), /Secure; HttpOnly; SameSite=Strict; Max-Age=0/);
  await assert.rejects(pending.revalidate(), /session-rejected/);
  for (const plugin of ['titan_zero','titan_operations','titan_web']) assert.equal((await gateway(f.request(`/v1/directadmin/${plugin}/projection`))).status, 401);
  const current = await f.registry.resolveCurrentSession({ ...proof, session_revision: 2 }, { ...expected, company_id: 'company-b' }, new Date(f.now).toISOString());
  const token = await f.sign({ company_id: 'company-b', session_revision: 2, context_revision: current.context_revision });
  const auth = await f.bridge.authenticate(f.request(undefined, { headers: { cookie: `__Host-titan-da-session=${token}` } }));
  assert.deepEqual(auth.context.company_ids, ['company-b']);
});

test('revocation while a canonical read is pending suppresses the returned company data', async t => {
  const f = await fixture(t); const original = f.owners.projection;
  f.owners.projection = async (...args) => { const result = await original(...args); await f.registry.revokeSession('session-1', 1); return result; };
  const response = await createDirectAdminGateway(f.bridge, f.owners)(f.request('/v1/directadmin/titan_zero/projection'));
  assert.equal(response.status, 401); assert.equal(JSON.stringify(await response.json()).includes('company-a'), false);
});

test('downstream effect revalidation rejects an intent revoked after ingress', async t => {
  const f = await fixture(t);
  f.owners.requestIntent = async (_p, _i, _c, revalidate) => { await f.registry.revokeSession('session-1', 1); await revalidate(); f.effects.push('executed'); return { receipt_id: 'never' }; };
  const response = await createDirectAdminGateway(f.bridge, f.owners)(f.request('/v1/directadmin/titan_zero/intents', post(intentBody(f))));
  assert.equal(response.status, 401); assert.deepEqual(f.effects, []);
});

test('gateway rejects cross-company owner projection, oversized body and redacts owner failures', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  f.owners.projection = async () => ({ company_id: 'company-b', data: { secret: 'never' } });
  assert.equal((await gateway(f.request('/v1/directadmin/titan_zero/projection'))).status, 503);
  f.owners.projection = async () => { throw new Error(`cookie=${f.token}; password=do-not-print`); };
  const response = await gateway(f.request('/v1/directadmin/titan_web/projection'));
  assert.equal(await response.text(), '{"error":"directadmin-context-or-owner-unavailable","read_only":true}');
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'self'/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await gateway(f.request('/v1/directadmin/titan_zero/intents', post({ ...intentBody(f), input: { big: 'x'.repeat(70_000) } })))).status, 503);
  const safe = redactDirectAdminDiagnostics({ cookie: f.token, session_id: 'session-1', csrf, message: `Rejected ${f.token}` });
  assert.deepEqual(safe, { cookie: '[REDACTED]', session_id: '[REDACTED]', csrf: '[REDACTED]', message: 'Rejected [REDACTED]' });
});

// Minimal DOM fixture executes the real consumer modules and shared renderer;
// browser/Evolution commissioning is a separate required host verification.
function root() {
  const doc = { createElement: tag => ({ tag, textContent: '', children: [], attrs: {},
    setAttribute(k,v) { this.attrs[k] = v; }, replaceChildren(...children) { this.children = children; },
    addEventListener() {}, removeEventListener() {}, ownerDocument: doc }) };
  return doc.createElement('section');
}

test('three real consumer modules share signed-session gateway over disposable HTTP and purge together', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  const server = createServer(async (incoming, outgoing) => {
    const chunks = []; for await (const chunk of incoming) chunks.push(chunk);
    const headers = { ...incoming.headers }; delete headers.host; delete headers['content-length'];
    const request = new Request(`${ORIGIN}${incoming.url}`, { method: incoming.method, headers,
      ...(incoming.method === 'POST' ? { body: Buffer.concat(chunks) } : {}) });
    const response = await gateway(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers)); outgoing.end(await response.text());
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening'); t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const fetcher = (path, init) => fetch(`http://127.0.0.1:${server.address().port}${path}`, { ...init,
    headers: { ...init.headers, cookie: `__Host-titan-da-session=${f.token}`, origin: ORIGIN, 'sec-fetch-site': 'same-origin' } });
  const session = new DirectAdminCockpitSession(() => csrf, fetcher); t.after(() => session.dispose());
  await session.connect();
  const roots = [root(), root(), root()];
  const mounts = [mountZeroCore(session, roots[0]), mountOperationsHub(session, roots[1]), mountBrandStudio(session, roots[2])];
  for (const mount of mounts) await mount.refresh();
  assert.match(roots[0].children[1].textContent, /0 attention items/);
  assert.match(roots[1].children[1].textContent, /0 observed nodes/);
  assert.match(roots[2].children[1].textContent, /Publication publication-1/);
  assert.ok(roots.every(r => r.children[2].textContent.includes('Source: titan_')));
  await session.switchCompany('company-b');
  assert.ok(roots.every(r => r.children[1].textContent.startsWith('Read-only') && r.children[2].textContent === ''));
  for (const mount of mounts) await mount.refresh();
  assert.ok(roots.every(r => !r.children[2].textContent));
  for (const mount of mounts) mount.dispose();
});

test('in-flight browser projections cannot repopulate after invalidation', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  let release; const waiting = new Promise(resolve => { release = resolve; });
  const session = new DirectAdminCockpitSession(() => csrf, async (path, init) => {
    const response = await gateway(f.request(path, { headers: init.headers })); await waiting; return response;
  }); t.after(() => session.dispose());
  const pending = session.projection('titan_zero'); session.invalidate(); release();
  await assert.rejects(pending, /context-invalidated/);
});

for (const action of ['connect', 'projection']) for (const invalidate of ['invalidate', 'dispose']) {
  test(`independent review regression: ${invalidate} between send settlement and ${action} cannot restore context`, async t => {
    const f = await fixture(t); const auth = await f.bridge.authenticate(f.request());
    let calls = 0;
    let session;
    session = new DirectAdminCockpitSession(() => csrf, async () => {
      calls++;
      return { ok: true, json: async () => {
        queueMicrotask(() => queueMicrotask(() => session[invalidate]()));
        return action === 'connect' ? auth.context : { context: auth.context, projection: await f.owners.projection('titan_zero', auth.context) };
      } };
    }); t.after(() => session.dispose());
    await assert.rejects(action === 'connect' ? session.connect() : session.projection('titan_zero'), /context-invalidated/);
    await assert.rejects(session.intent('titan_zero', intentBody(f)), /context-mismatch/);
    assert.equal(calls, 1);
  });
}

test('one unavailable plugin degrades locally without clearing healthy sibling workspaces', async t => {
  const f = await fixture(t); const original = f.owners.projection;
  f.owners.projection = async (plugin, context) => {
    if (plugin === 'titan_operations') throw new Error('backend offline'); return original(plugin, context);
  };
  const gateway = createDirectAdminGateway(f.bridge, f.owners);
  const session = new DirectAdminCockpitSession(() => csrf, async (path, init) => gateway(f.request(path, { headers: init.headers })));
  t.after(() => session.dispose()); await session.connect();
  const zero = root(), ops = root(), brand = root();
  const mounts = [mountZeroCore(session, zero), mountOperationsHub(session, ops), mountBrandStudio(session, brand)];
  await mounts[0].refresh(); await mounts[2].refresh(); await mounts[1].refresh();
  assert.match(zero.children[1].textContent, /0 attention/);
  assert.match(brand.children[1].textContent, /Publication publication-1/);
  assert.match(ops.children[1].textContent, /projection unavailable/);
});

test('logout revokes durable current session rather than only removing a client cookie', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  assert.equal((await gateway(f.request('/v1/directadmin/logout', post({})))).status, 200);
  await assert.rejects(f.bridge.authenticate(f.request()), /session-rejected/);
});

test('cross-tab invalidation clears every mounted consumer without accepting a supplied company', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  const channel = { onmessage: null, postMessage() {}, close() {} };
  const session = new DirectAdminCockpitSession(() => csrf, (path, init) => gateway(f.request(path, { headers: init.headers })), channel);
  t.after(() => session.dispose()); await session.connect(); const r = root(); const mount = mountZeroCore(session, r); await mount.refresh();
  channel.onmessage({ data: { company_id: 'company-b', authority: 'allowed' } });
  assert.equal(r.children[2].textContent, ''); await assert.rejects(session.intent('titan_zero', intentBody(f)), /context-mismatch/);
});
