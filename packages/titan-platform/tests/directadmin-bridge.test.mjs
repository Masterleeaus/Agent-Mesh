import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { tsImport } from 'tsx/esm/api';
const sdk = await tsImport('../src/directadmin-plugin.ts', { parentURL: import.meta.url, tsconfig: false });
const security = await tsImport('../src/security-boundary.ts', { parentURL: import.meta.url, tsconfig: false });
const { DirectAdminSessionBridge, createDirectAdminGateway, DirectAdminCockpitSession,
  directAdminBridgeFailureKind, redactDirectAdminDiagnostics } = sdk;
const { createSessionCredentialService, createSessionCredentialVerifier, directAdminIssuer } = security;
const { mountZeroCore } = await tsImport('../../../apps/directadmin/zero-core/cockpit.mjs', { parentURL: import.meta.url, tsconfig: false });
const { mountOperationsHub } = await tsImport('../../../apps/directadmin/operations-hub/cockpit.mjs', { parentURL: import.meta.url, tsconfig: false });
const { mountBrandStudio } = await tsImport('../../../apps/directadmin/brand-studio/cockpit.mjs', { parentURL: import.meta.url, tsconfig: false });
import { fixture, ORIGIN, b64, encode, external, proof, expected, csrf } from './fixtures/directadmin-bridge-fixture.mjs';

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

test('rejects a canonical credential whose verified provider is another DirectAdmin host issuer', async t => {
  const f = await fixture(t);
  const otherProvider = directAdminIssuer('https://other-panel.example.test');
  await f.registry.putExternalBinding({ binding_id: 'mapping-other-host', provider: otherProvider,
    subject: 'host-human-17', actor_id: 'actor-1', company_id: 'company-a', status: 'active' }, null);
  const otherHostSessions = createSessionCredentialService({ ...f.policy,
    upstream: { ...f.policy.upstream, issuer: otherProvider } });
  const otherHostCredential = await otherHostSessions.issue(await f.loginFor(otherProvider, 'other-host-once'),
    { company_id: 'company-a', device_id: 'device-1' });
  assert.equal((await otherHostSessions.authenticate(otherHostCredential.credential)).provider, otherProvider);
  const bridge = new DirectAdminSessionBridge({ origin: ORIGIN, audience: expected.audience,
    node_id: 'node-1', sessions: otherHostSessions });
  const request = f.request(undefined, { headers: { cookie: `__Host-titan-da-session=${otherHostCredential.credential}` } });
  await assert.rejects(bridge.authenticate(request), /session-rejected/);
});

test('rejects a valid credential from this provider when bridge is configured for another host', async t => {
  const f = await fixture(t, { origin: 'https://panel-two.example.test' });
  const authenticated = await f.sessions.authenticate(f.token);
  assert.equal(authenticated.provider, external.provider);
  assert.equal(authenticated.context.audience, expected.audience);
  await assert.rejects(f.bridge.authenticate(f.request()), /session-rejected/);
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
  ['session', r => r.revokeSession(proof.session_id, 1)],
]) test(`current ${label} revocation invalidates authenticated pending work`, async t => {
  const f = await fixture(t); const auth = await f.bridge.authenticate(f.request());
  await revoke(f.registry); await assert.rejects(auth.revalidate(), /session-rejected/);
});

const intentBody = f => ({ company_id: 'company-a', actor_id: 'actor-1', context_revision: f.claims.context_revision,
  capability_id: 'ops.inspect', operation_id: 'operation-1', correlation_id: 'correlation-1', input: {} });
const post = body => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('trusted bootstrap exchanges a signed DirectAdmin assertion for only a selected-company HttpOnly session cookie', async t => {
  const f = await fixture(t);
  const login_assertion = await f.loginFor(external.provider, 'browser-bootstrap-once');
  const bootstrap = await f.bridge.bootstrapBrowserSession(
    f.request('/v1/directadmin/bootstrap', { method: 'POST', headers: { cookie: null } }),
    { login_assertion, company_id: 'company-a', device_id: 'device-1', csrf_token: csrf });
  assert.match(bootstrap.set_cookie, /^__Host-titan-da-session=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+; Path=\/; Secure; HttpOnly; SameSite=Strict; Max-Age=[1-9]\d*$/);
  assert.equal(bootstrap.set_cookie.includes(csrf), false);
  const cookie = bootstrap.set_cookie.split(';', 1)[0];
  const authenticated = await f.bridge.authenticate(f.request('/v1/directadmin/context', { headers: { cookie } }));
  assert.equal(authenticated.context.actor_id, 'actor-1');
  assert.equal(authenticated.context.company_id, 'company-a');
  assert.deepEqual(authenticated.context.company_ids, ['company-a']);
  assert.equal(authenticated.context.authority, 'not-carried');
});

test('bootstrap rejects cross-origin and extra caller identity before consuming the assertion', async t => {
  const f = await fixture(t);
  const input = { login_assertion: await f.loginFor(external.provider, 'bootstrap-origin-once'),
    company_id: 'company-a', device_id: 'device-1', csrf_token: csrf };
  const crossOrigin = f.request('/v1/directadmin/bootstrap', { method: 'POST', headers: { origin: 'https://attacker.test', cookie: null } });
  await assert.rejects(f.bridge.bootstrapBrowserSession(crossOrigin, input), error => directAdminBridgeFailureKind(error) === 'request-rejected');
  await assert.rejects(f.bridge.bootstrapBrowserSession(
    f.request('/v1/directadmin/bootstrap', { method: 'POST', headers: { cookie: null } }), { ...input, caller_id: 'root' }),
  error => directAdminBridgeFailureKind(error) === 'request-rejected');
  const issued = await f.bridge.bootstrapBrowserSession(
    f.request('/v1/directadmin/bootstrap', { method: 'POST', headers: { cookie: null } }), input);
  assert.match(issued.set_cookie, /^__Host-titan-da-session=/);
});

test('bootstrap company expectation must match the signed upstream selected company', async t => {
  const f = await fixture(t);
  await assert.rejects(f.bridge.bootstrapBrowserSession(
    f.request('/v1/directadmin/bootstrap', { method: 'POST', headers: { cookie: null } }),
    { login_assertion: await f.loginFor(external.provider, 'bootstrap-company-mismatch'),
      company_id: 'company-b', device_id: 'device-1', csrf_token: csrf }), /directadmin-session-rejected/);
  assert.equal((await f.storage.query('SELECT * FROM titan_security_sessions')).rows.length, 1);
});

test('bootstrap revokes an issued session if the trusted HTML CSRF nonce differs from its signed binding', async t => {
  const f = await fixture(t);
  const jti = 'bootstrap-csrf-mismatch';
  const assertion = await f.loginFor(external.provider, jti, { csrf_sha256: 'A'.repeat(43) });
  await assert.rejects(f.bridge.bootstrapBrowserSession(
    f.request('/v1/directadmin/bootstrap', { method: 'POST', headers: { cookie: null } }),
    { login_assertion: assertion, company_id: 'company-a', device_id: 'device-1', csrf_token: csrf }), /directadmin-session-rejected/);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([external.provider, jti]))));
  const session_id = `auth-${[...digest].map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
  const row = (await f.storage.query('SELECT revoked FROM titan_security_sessions WHERE session_id=$1', [session_id])).rows[0];
  assert.equal(row?.revoked, 1);
});

test('bootstrap reauthentication outage returns no credential and leaves only a short-lived orphan session', async t => {
  const f = await fixture(t);
  const jti = 'bootstrap-reauth-outage';
  const login_assertion = await f.loginFor(external.provider, jti);
  let issuedCredential;
  let issueCalls = 0;
  let authenticateCalls = 0;
  const sessions = {
    ...f.sessions,
    issue: async (...args) => {
      issueCalls++;
      const issued = await f.sessions.issue(...args);
      issuedCredential = issued.credential;
      return issued;
    },
    authenticate: async () => {
      authenticateCalls++;
      throw new Error('identity-registry-unavailable');
    },
  };
  const bridge = new DirectAdminSessionBridge({ origin: ORIGIN, audience: expected.audience, node_id: 'node-1', sessions });
  let failure;
  await assert.rejects(bridge.bootstrapBrowserSession(
    f.request('/v1/directadmin/bootstrap', { method: 'POST', headers: { cookie: null } }),
    { login_assertion, company_id: 'company-a', device_id: 'device-1', csrf_token: csrf }), error => {
    failure = error;
    return directAdminBridgeFailureKind(error) === 'unavailable';
  });
  assert.equal(issueCalls, 1);
  assert.equal(authenticateCalls, 1);
  assert.equal(failure.message, 'directadmin-service-unavailable');
  assert.equal(failure.message.includes(login_assertion), false);
  assert.equal(failure.message.includes(issuedCredential), false);

  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([external.provider, jti]))));
  const session_id = `auth-${[...digest].map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
  const row = (await f.storage.query('SELECT * FROM titan_security_sessions WHERE session_id=$1', [session_id])).rows[0];
  assert.ok(row);
  assert.equal(row.revoked, 0);
  assert.ok(Date.parse(row.expires_at) > f.now);
  assert.ok(Date.parse(row.expires_at) <= f.now + 300_000);
  assert.equal(JSON.stringify(row).includes(login_assertion), false);
  assert.equal(JSON.stringify(row).includes(issuedCredential), false);
  // #302 consumed the one-time assertion at issue; after recovery only a fresh
  // assertion may start another browser session.
  await assert.rejects(f.sessions.issue(login_assertion, { company_id: 'company-a', device_id: 'device-1' }), /authentication-denied/);
});

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

test('shared browser session consumes Workforce and encodes opaque canonical revisions for the fixed relay contract', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  const requests = []; const seen = [];
  f.owners.projection = async (plugin, context) => {
    seen.push({ kind: 'projection', plugin, company_id: context.company_id });
    return { company_id: context.company_id, source: 'canonical-workforce-runtime',
      freshness: new Date(f.now).toISOString(), evidence_refs: [],
      data: { schema: 'titan.workforce-cockpit.v1', company_id: context.company_id } };
  };
  f.owners.requestIntent = async (plugin, intent, context, revalidate) => {
    seen.push({ kind: 'intent', plugin, company_id: context.company_id, context_revision: context.context_revision,
      intent_context_revision: intent.context_revision });
    assert.equal((await revalidate()).context_revision, f.claims.context_revision);
    return { receipt_id: 'workforce-receipt-1' };
  };
  const session = new DirectAdminCockpitSession(() => csrf, async (path, init) => {
    requests.push({ path, method: init.method, body: init.body });
    return gateway(f.request(path, { method: init.method, headers: init.headers,
      ...(init.body === undefined ? {} : { body: init.body }) }));
  });
  t.after(() => session.dispose());
  await session.connect();
  const projection = await session.projection('titan_workforce');
  assert.equal(projection.data.schema, 'titan.workforce-cockpit.v1');
  const receipt = await session.intent('titan_workforce', { company_id: 'company-a', actor_id: 'actor-1',
    capability_id: 'workforce.inspect', operation_id: 'operation-workforce-1',
    correlation_id: 'correlation-workforce-1', input: {} });
  assert.deepEqual(receipt, { status: 'REQUESTED', receipt_id: 'workforce-receipt-1', correlation_id: 'correlation-workforce-1' });
  assert.deepEqual(seen.map(item => [item.kind, item.plugin]), [['projection', 'titan_workforce'], ['intent', 'titan_workforce']]);
  assert.equal(seen[1].company_id, 'company-a');
  assert.equal(seen[1].context_revision, f.claims.context_revision);
  assert.equal(seen[1].intent_context_revision, undefined);
  const wire = JSON.parse(requests.at(-1).body);
  assert.match(wire.context_revision, /^ctx1_[A-Za-z0-9_-]{43}$/);
  assert.notEqual(wire.context_revision, f.claims.context_revision);
  const mismatch = await gateway(f.request('/v1/directadmin/titan_workforce/intents', post({ ...intentBody(f),
    context_revision: `ctx1_${'A'.repeat(43)}` })));
  assert.equal(mismatch.status, 409);
});

test('SDK exchanges the authenticated DA session for a fixed selected-company Workforce child inside the owner callback', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  let childCredential;
  let childContext;
  let authenticatedChild;
  f.owners.requestIntent = async (_plugin, _intent, _context, revalidate, withWorkforceZeroSession) => {
    const current = await revalidate();
    assert.equal(current.company_id, 'company-a');
    return withWorkforceZeroSession(async (credential, context) => {
      childCredential = credential;
      childContext = context;
      authenticatedChild = await f.workforceVerifier.authenticate(credential);
      return { receipt_id: 'receipt-1' };
    });
  };
  const response = await gateway(f.request('/v1/directadmin/titan_zero/intents', {
    ...post(intentBody(f)), headers: { 'content-type': 'application/json', 'x-titan-company-id': 'company-b', caller_id: 'root' },
  }));
  assert.equal(response.status, 202);
  const bodyText = await response.text();
  assert.deepEqual(JSON.parse(bodyText), { status: 'REQUESTED', receipt_id: 'receipt-1', correlation_id: 'correlation-1' });
  assert.ok(childCredential);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(childContext.schema, 'titan.workforce-zero.session/v1');
  assert.equal(childContext.audience, 'workforce');
  assert.equal(childContext.surface, 'zero');
  assert.equal(childContext.actor_id, 'actor-1');
  assert.equal(childContext.company_id, 'company-a');
  assert.deepEqual(childContext.company_ids, ['company-a']);
  assert.equal(typeof childContext.session_id, 'string');
  assert.notEqual(childContext.session_id, f.claims.session_id);
  assert.equal('da_role' in childContext, false);
  assert.equal(authenticatedChild.context.audience, 'workforce');
  assert.equal(authenticatedChild.surface, 'zero');
  assert.equal(authenticatedChild.context.session_id === f.claims.session_id, false);
  assert.deepEqual(authenticatedChild.context.allowed_company_ids, ['company-a']);
  assert.equal(authenticatedChild.source_session.provider, external.provider);
  assert.equal(authenticatedChild.source_session.subject, external.subject);
  assert.equal(authenticatedChild.source_session.session_id, f.claims.session_id);
  assert.equal(authenticatedChild.source_session.session_revision, f.claims.session_revision);
  assert.equal(authenticatedChild.source_session.context_revision, f.claims.context_revision);
  assert.equal(authenticatedChild.source_session.company_id, 'company-a');
  assert.equal(authenticatedChild.source_session.actor_id, 'actor-1');
  assert.equal(authenticatedChild.source_session.device_id, 'device-1');
  assert.ok(Date.parse(authenticatedChild.credential_expires_at) <= Date.parse(f.policy.now().toISOString()) + 120_000);
  assert.equal(bodyText.includes(childCredential), false);
  assert.equal(bodyText.includes(f.token), false);

  await f.sessions.switchCompany(f.token, { company_id: 'company-a', device_id: 'device-1',
    actor_id: 'actor-1', context_revision: f.claims.context_revision }, 'company-b');
  await assert.rejects(f.workforceVerifier.authenticate(childCredential), /authentication-denied/);
});

test('gateway refuses to serialize an exchanged Workforce bearer as an owner receipt', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  let childCredential;
  f.owners.requestIntent = async (_plugin, _intent, _context, _revalidate, withWorkforceZeroSession) =>
    withWorkforceZeroSession(async credential => { childCredential = credential; return { receipt_id: credential }; });
  const response = await gateway(f.request('/v1/directadmin/titan_zero/intents', post(intentBody(f))));
  assert.equal(response.status, 503);
  const bodyText = await response.text();
  assert.deepEqual(JSON.parse(bodyText), { error: 'directadmin-context-or-owner-unavailable', read_only: true });
  assert.equal(bodyText.includes(childCredential), false);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('Workforce intent route keeps the owner typed denial while the DirectAdmin session remains current', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  class DirectAdminWorkforceActionDenied extends Error {
    code = 'directadmin-workforce-action-unsupported';
    status = 403;
    constructor() { super('unsupported-action details must stay private'); this.name = 'DirectAdminWorkforceActionDenied'; }
  }
  let callbackCount = 0;
  f.owners.requestIntent = async (plugin, _intent, context, revalidate, withWorkforceZeroSession) => {
    assert.equal(plugin, 'titan_workforce');
    assert.equal((await revalidate()).company_id, context.company_id);
    await withWorkforceZeroSession(async (credential, child) => {
      callbackCount++;
      assert.equal((await f.workforceVerifier.authenticate(credential)).context.audience, 'workforce');
      assert.deepEqual(child.company_ids, ['company-a']);
      throw new DirectAdminWorkforceActionDenied();
    });
    return { receipt_id: 'must-not-be-requested' };
  };
  const response = await gateway(f.request('/v1/directadmin/titan_workforce/intents', post(intentBody(f))));
  assert.equal(callbackCount, 1);
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'directadmin-workforce-action-unsupported', read_only: true });
});

test('typed Workforce 403 keeps the shared browser context and sibling subscribers valid', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  class DirectAdminWorkforceActionDenied extends Error {
    code = 'directadmin-workforce-action-unsupported';
    status = 403;
    constructor() { super('private unsupported-action details'); this.name = 'DirectAdminWorkforceActionDenied'; }
  }
  f.owners.requestIntent = async () => { throw new DirectAdminWorkforceActionDenied(); };
  const session = new DirectAdminCockpitSession(() => csrf, async (path, init) => gateway(f.request(path, {
    method: init.method, headers: init.headers, ...(init.body === undefined ? {} : { body: init.body }),
  })));
  t.after(() => session.dispose());
  await session.connect();
  let invalidations = 0;
  const unsubscribe = session.subscribe(() => { invalidations++; });
  t.after(unsubscribe);
  await assert.rejects(session.intent('titan_workforce', { company_id: 'company-a', actor_id: 'actor-1',
    capability_id: 'workforce.inspect', operation_id: 'unsupported-1', correlation_id: 'unsupported-1', input: {} }),
  /directadmin-http-403/);
  assert.equal(invalidations, 0);
  const projection = await session.projection('titan_workforce');
  assert.equal(projection.company_id, 'company-a');
  assert.equal(invalidations, 0);
});

test('a typed Workforce denial is suppressed when the DirectAdmin source is revoked in its callback', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  class DirectAdminWorkforceActionDenied extends Error {
    code = 'directadmin-workforce-action-unsupported';
    status = 403;
    constructor() { super('private detail'); this.name = 'DirectAdminWorkforceActionDenied'; }
  }
  f.owners.requestIntent = async (_plugin, _intent, _context, _revalidate, withWorkforceZeroSession) =>
    withWorkforceZeroSession(async () => {
      await f.registry.revokeSession(proof.session_id, 1);
      throw new DirectAdminWorkforceActionDenied();
    });
  const response = await gateway(f.request('/v1/directadmin/titan_workforce/intents', post(intentBody(f))));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'directadmin-session-rejected', read_only: true });
});

test('non-Zero plugin owners cannot exchange the Workforce/Zero child credential', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  let childCredential;
  f.owners.requestIntent = async (_plugin, _intent, _context, _revalidate, withWorkforceZeroSession) => {
    await assert.rejects(withWorkforceZeroSession(async credential => {
      childCredential = credential;
      return { receipt_id: 'should-not-run' };
    }), /directadmin-workforce-zero-unavailable/);
    return { receipt_id: 'receipt-operations' };
  };
  const response = await gateway(f.request('/v1/directadmin/titan_operations/intents', post(intentBody(f))));
  assert.equal(response.status, 202);
  assert.equal(childCredential, undefined);
  assert.deepEqual(await response.json(), { status: 'REQUESTED', receipt_id: 'receipt-operations', correlation_id: 'correlation-1' });
});

test('company switch changes canonical revision and old credentials fail for every plugin route', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  const pending = await f.bridge.authenticate(f.request());
  const response = await gateway(f.request('/v1/directadmin/company', post({ company_id: 'company-b' })));
  assert.equal(response.status, 200); assert.match(response.headers.get('set-cookie'), /Secure; HttpOnly; SameSite=Strict; Max-Age=[1-9]/);
  assert.deepEqual(await response.json(), { status: 'context-changed' });
  await assert.rejects(pending.revalidate(), /session-rejected/);
  for (const plugin of ['titan_zero','titan_workforce','titan_operations','titan_web']) assert.equal((await gateway(f.request(`/v1/directadmin/${plugin}/projection`))).status, 401);
  const current = await f.registry.resolveCurrentSession({ ...proof, session_revision: 2 }, { ...expected, company_id: 'company-b' }, new Date(f.now).toISOString());
  const token = response.headers.get('set-cookie').split(';')[0].slice('__Host-titan-da-session='.length);
  assert.notEqual(token, f.token);
  assert.equal((await f.sessions.authenticate(token)).context.context_revision, current.context_revision);
  const auth = await f.bridge.authenticate(f.request(undefined, { headers: { cookie: `__Host-titan-da-session=${token}` } }));
  assert.deepEqual(auth.context.company_ids, ['company-b']);
});

test('gateway clears a canonically rejected session but does not clear cookies for an origin rejection', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  await f.registry.revokeSession(proof.session_id, 1);
  const revoked = await gateway(f.request());
  assert.equal(revoked.status, 401);
  assert.match(revoked.headers.get('set-cookie') ?? '', /__Host-titan-da-session=;.*Max-Age=0/);
  const crossOrigin = await gateway(f.request(undefined, { headers: { origin: 'https://attacker.test' } }));
  assert.equal(crossOrigin.status, 401);
  assert.equal(crossOrigin.headers.get('set-cookie'), null);
});

test('revocation while a canonical read is pending suppresses the returned company data', async t => {
  const f = await fixture(t); const original = f.owners.projection;
  f.owners.projection = async (...args) => { const result = await original(...args); await f.registry.revokeSession(proof.session_id, 1); return result; };
  const response = await createDirectAdminGateway(f.bridge, f.owners)(f.request('/v1/directadmin/titan_zero/projection'));
  assert.equal(response.status, 401); assert.equal(JSON.stringify(await response.json()).includes('company-a'), false);
});

test('downstream effect revalidation rejects an intent revoked after ingress', async t => {
  const f = await fixture(t);
  f.owners.requestIntent = async (_p, _i, _c, revalidate) => { await f.registry.revokeSession(proof.session_id, 1); await revalidate(); f.effects.push('executed'); return { receipt_id: 'never' }; };
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

test('gateway preserves only the canonical typed Workforce unsupported-action denial', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  class DirectAdminWorkforceActionDenied extends Error {
    code = 'directadmin-workforce-action-unsupported';
    status = 403;
    constructor(action) {
      super(`DirectAdmin Workforce action is not supported: ${action}`);
      this.name = 'DirectAdminWorkforceActionDenied';
    }
  }
  const privateDiagnostic = `private-work-id=${f.token}`;
  f.owners.requestIntent = async () => { throw new DirectAdminWorkforceActionDenied(privateDiagnostic); };
  const response = await gateway(f.request('/v1/directadmin/titan_operations/intents', post(intentBody(f))));
  assert.equal(response.status, 403);
  const responseBody = await response.text();
  assert.deepEqual(JSON.parse(responseBody), { error: 'directadmin-workforce-action-unsupported', read_only: true });
  assert.equal(responseBody.includes(privateDiagnostic), false);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('gateway treats status/code lookalikes and hostile typed-error accessors as service failures', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  let getterCalls = 0;
  const generic403 = Object.assign(new Error(`do-not-return:${f.token}`), { status: 403, code: 'some-other-owner-error' });
  const lookalike = Object.assign(new Error(`do-not-return:${f.token}`), {
    name: 'DirectAdminWorkforceActionDenied', code: 'directadmin-workforce-action-unsupported', status: 403,
  });
  class DirectAdminWorkforceActionDenied extends Error {
    status = 403;
    constructor() { super('hostile typed denial'); this.name = 'DirectAdminWorkforceActionDenied'; }
  }
  const accessorBacked = new DirectAdminWorkforceActionDenied();
  Object.defineProperty(accessorBacked, 'code', { get() { getterCalls++; throw new Error('getter must not run'); } });
  for (const error of [generic403, lookalike, accessorBacked, new Error(`owner unavailable:${f.token}`)]) {
    f.owners.requestIntent = async () => { throw error; };
    const response = await gateway(f.request('/v1/directadmin/titan_operations/intents', post(intentBody(f))));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'directadmin-context-or-owner-unavailable', read_only: true });
  }
  assert.equal(getterCalls, 0);
  f.owners.requestIntent = undefined; // An unconfigured owner also remains unavailable.
  const unavailable = await gateway(f.request('/v1/directadmin/titan_operations/intents', post(intentBody(f))));
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), { error: 'directadmin-context-or-owner-unavailable', read_only: true });
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

test('an unavailable canonical authentication service returns a redacted 503', async t => {
  const f = await fixture(t, { sessionOverrides: {
    authenticate: async () => { throw new Error(`sqlite-path=/private/db; credential=${f.token}`); },
  } });
  const response = await createDirectAdminGateway(f.bridge, f.owners)(f.request());
  assert.equal(response.status, 503);
  const text = await response.text();
  assert.deepEqual(JSON.parse(text), { error: 'directadmin-context-or-owner-unavailable', read_only: true });
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(text.includes(f.token), false);
});

test('canonical identity-registry outage maps to unavailable, not a rejected browser session', async t => {
  const ingress = await fixture(t, { sessionOverrides: {
    authenticate: async () => { throw new Error('identity-registry-unavailable'); },
  } });
  const ingressResponse = await createDirectAdminGateway(ingress.bridge, ingress.owners)(ingress.request());
  assert.equal(ingressResponse.status, 503);
  assert.deepEqual(await ingressResponse.json(), { error: 'directadmin-context-or-owner-unavailable', read_only: true });
  assert.equal(ingressResponse.headers.get('set-cookie'), null);

  const f = await fixture(t);
  const canonicalAuthenticate = f.sessions.authenticate.bind(f.sessions);
  let authenticationCalls = 0;
  f.bridgeSessions.authenticate = async (...args) => {
    authenticationCalls++;
    if (authenticationCalls === 3) throw new Error('identity-registry-unavailable');
    return canonicalAuthenticate(...args);
  };
  f.bridgeSessions.switchCompany = async () => { throw new Error(`provider detail ${f.token}`); };
  const response = await createDirectAdminGateway(f.bridge, f.owners)(
    f.request('/v1/directadmin/company', post({ company_id: 'company-b' })),
  );
  assert.equal(authenticationCalls, 3);
  assert.equal(response.status, 503);
  const bodyText = await response.text();
  assert.deepEqual(JSON.parse(bodyText), { error: 'directadmin-context-or-owner-unavailable', read_only: true });
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(bodyText.includes(f.token), false);
});

test('rejected replacement session after company switch returns 401 and clears the stale cookie', async t => {
  const f = await fixture(t);
  const canonicalAuthenticate = f.sessions.authenticate.bind(f.sessions);
  f.bridgeSessions.authenticate = async (credential, expectation) => {
    if (credential !== f.token) throw new Error('authentication-denied');
    return canonicalAuthenticate(credential, expectation);
  };
  const response = await createDirectAdminGateway(f.bridge, f.owners)(
    f.request('/v1/directadmin/company', post({ company_id: 'company-b' })),
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'directadmin-session-rejected', read_only: true });
  assert.match(response.headers.get('set-cookie') ?? '', /Max-Age=0/);
  assert.equal(response.headers.get('set-cookie')?.includes(f.token), false);
});

test('registry outage verifying a replacement company session returns 503 without clearing the source cookie', async t => {
  const f = await fixture(t);
  const canonicalAuthenticate = f.sessions.authenticate.bind(f.sessions);
  f.bridgeSessions.authenticate = async (credential, expectation) => {
    if (credential !== f.token) throw new Error('identity-registry-unavailable');
    return canonicalAuthenticate(credential, expectation);
  };
  const response = await createDirectAdminGateway(f.bridge, f.owners)(
    f.request('/v1/directadmin/company', post({ company_id: 'company-b' })),
  );
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'directadmin-context-or-owner-unavailable', read_only: true });
  assert.equal(response.headers.get('set-cookie'), null);
});

test('Workforce exchange service failure is a redacted 503 while the source session remains usable', async t => {
  const f = await fixture(t, { sessionOverrides: {
    exchangeWorkforceZero: async () => { throw new Error(`bearer=${f.token}; db=/private/path`); },
  } });
  const gateway = createDirectAdminGateway(f.bridge, f.owners);
  f.owners.requestIntent = async (_plugin, _intent, _context, _revalidate, withWorkforceZeroSession) =>
    withWorkforceZeroSession(async () => ({ receipt_id: 'never-issued' }));
  const response = await gateway(f.request('/v1/directadmin/titan_zero/intents', post(intentBody(f))));
  assert.equal(response.status, 503);
  const text = await response.text();
  assert.deepEqual(JSON.parse(text), { error: 'directadmin-context-or-owner-unavailable', read_only: true });
  assert.equal(text.includes(f.token), false);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal((await gateway(f.request())).status, 200);
  assert.equal((await f.sessions.authenticate(f.token)).context.company_id, 'company-a');
});

test('company-switch service failure returns 503 without rotating or clearing the source session', async t => {
  const f = await fixture(t, { sessionOverrides: {
    switchCompany: async () => { throw new Error(`secret=${f.token}; storage=unavailable`); },
  } });
  const gateway = createDirectAdminGateway(f.bridge, f.owners);
  const response = await gateway(f.request('/v1/directadmin/company', post({ company_id: 'company-b' })));
  assert.equal(response.status, 503);
  const text = await response.text();
  assert.deepEqual(JSON.parse(text), { error: 'directadmin-context-or-owner-unavailable', read_only: true });
  assert.equal(text.includes(f.token), false);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal((await gateway(f.request())).status, 200);
  assert.equal((await f.sessions.authenticate(f.token)).context.company_id, 'company-a');
});

test('logout revocation service failure returns 503 without clearing a still-valid session cookie', async t => {
  const f = await fixture(t, { sessionOverrides: {
    revoke: async () => { throw new Error(`session=${f.token}; sqlite=/private`); },
  } });
  const gateway = createDirectAdminGateway(f.bridge, f.owners);
  const response = await gateway(f.request('/v1/directadmin/logout', post({})));
  assert.equal(response.status, 503);
  const text = await response.text();
  assert.deepEqual(JSON.parse(text), { error: 'directadmin-context-or-owner-unavailable', read_only: true });
  assert.equal(text.includes(f.token), false);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal((await gateway(f.request())).status, 200);
  assert.equal((await f.sessions.authenticate(f.token)).context.company_id, 'company-a');
});

for (const [operation, sessionMethod, path] of [
  ['exchange', 'exchangeWorkforceZero', '/v1/directadmin/titan_zero/intents'],
  ['company switch', 'switchCompany', '/v1/directadmin/company'],
  ['logout', 'revoke', '/v1/directadmin/logout'],
]) test(`${operation} canonical denial is revalidated and reported as unavailable when the source remains active`, async t => {
  const f = await fixture(t, { sessionOverrides: {
    [sessionMethod]: async () => { throw new Error('authentication-denied'); },
  } });
  const gateway = createDirectAdminGateway(f.bridge, f.owners);
  if (sessionMethod === 'exchangeWorkforceZero') {
    f.owners.requestIntent = async (_plugin, _intent, _context, _revalidate, withWorkforceZeroSession) =>
      withWorkforceZeroSession(async () => ({ receipt_id: 'never-issued' }));
  }
  const options = sessionMethod === 'exchangeWorkforceZero' ? post(intentBody(f))
    : sessionMethod === 'switchCompany' ? post({ company_id: 'company-b' }) : post({});
  const response = await gateway(f.request(path, options));
  assert.equal(response.status, 503);
  const text = await response.text();
  assert.deepEqual(JSON.parse(text), { error: 'directadmin-context-or-owner-unavailable', read_only: true });
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal((await gateway(f.request())).status, 200);
  assert.equal((await f.sessions.authenticate(f.token)).context.company_id, 'company-a');
});

test('cross-tab invalidation clears every mounted consumer without accepting a supplied company', async t => {
  const f = await fixture(t); const gateway = createDirectAdminGateway(f.bridge, f.owners);
  const channel = { onmessage: null, postMessage() {}, close() {} };
  const session = new DirectAdminCockpitSession(() => csrf, (path, init) => gateway(f.request(path, { headers: init.headers })), channel);
  t.after(() => session.dispose()); await session.connect(); const r = root(); const mount = mountZeroCore(session, r); await mount.refresh();
  channel.onmessage({ data: { company_id: 'company-b', authority: 'allowed' } });
  assert.equal(r.children[2].textContent, ''); await assert.rejects(session.intent('titan_zero', intentBody(f)), /context-mismatch/);
});

for (const [label, mutate] of [
  ['nested company relabelling', p => ({ ...p, data: { ...p.data, company_id: 'company-b' } })],
  ['missing nested company', p => ({ ...p, data: { schema: 'titan.zero-cockpit.v1' } })],
  ['missing source', p => ({ ...p, source: '' })],
  ['invalid freshness', p => ({ ...p, freshness: 'yesterday-ish' })],
  ['missing evidence array', p => ({ ...p, evidence_refs: null })],
  ['malformed evidence reference', p => ({ ...p, evidence_refs: [{ token: 'do-not-render' }] })],
]) test(`projection boundary rejects ${label} at gateway and browser`, async t => {
  const f = await fixture(t); const original = f.owners.projection;
  f.owners.projection = async (...args) => mutate(await original(...args));
  const gateway = createDirectAdminGateway(f.bridge, f.owners);
  assert.equal((await gateway(f.request('/v1/directadmin/titan_zero/projection'))).status, 503);
  const auth = await f.bridge.authenticate(f.request());
  const session = new DirectAdminCockpitSession(() => csrf, async () => new Response(JSON.stringify({ context: auth.context,
    projection: mutate(await original('titan_zero', auth.context)) }), { headers: { 'content-type': 'application/json' } }));
  t.after(() => session.dispose()); await assert.rejects(session.projection('titan_zero'), /invalid-projection/);
});

for (const [label, modify, expected] of [
  ['incompatible schema', p => ({ ...p, data: { ...p.data, schema: 'titan.zero-cockpit.v99' } }), 'incompatible'],
  ['unknown freshness', p => ({ ...p, freshness: null }), 'unknown'],
  ['future freshness', p => ({ ...p, freshness: new Date(Date.now() + 300_000).toISOString() }), 'unknown'],
  ['stale projection', p => ({ ...p, freshness: new Date(Date.now() - 600_000).toISOString() }), 'stale'],
]) test(`renderer exposes ${label} as read-only without a fresh data summary`, async t => {
  const f = await fixture(t); const original = f.owners.projection;
  f.owners.projection = async (...args) => modify(await original(...args));
  const gateway = createDirectAdminGateway(f.bridge, f.owners);
  const session = new DirectAdminCockpitSession(() => csrf, (path, init) => gateway(f.request(path, { headers: init.headers })));
  t.after(() => session.dispose()); const r = root(); await mountZeroCore(session, r).refresh();
  assert.equal(r.attrs['data-state'], expected); assert.match(r.children[1].textContent, /^Read-only/);
  assert.doesNotMatch(r.children[1].textContent, /attention items/);
});

test('a projection response cannot silently replace the selected company or restore an intent context', async t => {
  const f = await fixture(t); const auth = await f.bridge.authenticate(f.request());
  let replace = false, requests = 0;
  const session = new DirectAdminCockpitSession(() => csrf, async () => {
    requests++;
    if (!replace) return new Response(JSON.stringify(auth.context));
    const context = { ...auth.context, company_id: 'company-b', company_ids: ['company-b'], context_revision: 'new' };
    return new Response(JSON.stringify({ context, projection: await f.owners.projection('titan_zero', context) }));
  }); t.after(() => session.dispose()); await session.connect(); replace = true;
  await assert.rejects(session.projection('titan_zero'), /context-invalidated/);
  await assert.rejects(session.intent('titan_zero', { ...intentBody(f), company_id: 'company-b' }), /context-mismatch/);
  assert.equal(requests, 2);
});

test('DA browser bridge accepts only canonical session credentials, not login assertions or the removed provisional format', async t => {
  const f = await fixture(t);
  const auth = await f.bridge.authenticate(f.request());
  assert.equal(auth.context.company_id, 'company-a');
  for (const token of [f.upstreamToken, await f.sign({}, { typ: 'titan-da-session+jwt' })]) {
    await assert.rejects(f.bridge.authenticate(f.request(undefined, { headers: { cookie: `__Host-titan-da-session=${token}` } })), /session-rejected/);
  }
  await assert.rejects(f.sessions.issue(f.upstreamToken, { company_id: 'company-a', device_id: 'device-1' }), /authentication-denied/);
});

test('bridge checks its commissioned node and audience even if a different canonical service was supplied', async t => {
  const f = await fixture(t);
  for (const patch of [{ node_id: 'node-2' }, { audience: 'workforce' }]) {
    const bridge = new DirectAdminSessionBridge({ origin: ORIGIN, node_id: 'node-1', audience: expected.audience, sessions: f.sessions, ...patch });
    await assert.rejects(bridge.authenticate(f.request()), /session-rejected/);
  }
});

test('every retained bridge revalidation returns through the canonical credential authenticator', async t => {
  const f = await fixture(t); let calls = 0;
  const sessions = { ...f.sessions, authenticate: async (...args) => { calls++; return f.sessions.authenticate(...args); } };
  const bridge = new DirectAdminSessionBridge({ origin: ORIGIN, node_id: 'node-1', audience: expected.audience, sessions });
  const auth = await bridge.authenticate(f.request()); await auth.revalidate(); await auth.revalidate();
  assert.equal(calls, 3);
  await f.sessions.revoke(f.token, { company_id: 'company-a', device_id: 'device-1' });
  await assert.rejects(auth.revalidate(), /session-rejected/); assert.equal(calls, 4);
});

test('a signing-disabled canonical service can read but cannot switch company', async t => {
  const f = await fixture(t);
  const sessions = createSessionCredentialService({ ...f.policy, signing_key: undefined });
  const bridge = new DirectAdminSessionBridge({ origin: ORIGIN, node_id: 'node-1', audience: expected.audience, sessions });
  const auth = await bridge.authenticate(f.request(undefined, { method: 'POST' }));
  await assert.rejects(auth.switchCompany('company-b'), /service-unavailable/);
  assert.equal((await auth.revalidate()).company_id, 'company-a');
});

test('canonical Workforce audience cannot accept or relabel a DirectAdmin session credential', async t => {
  const f = await fixture(t);
  const verifier = createSessionCredentialVerifier({ ...f.policy, audience: 'workforce' });
  await assert.rejects(verifier.authenticate(f.token), /authentication-denied/);
  await assert.rejects(verifier.resolve(f.token, { company_id: 'company-a', device_id: 'device-1' }), /authentication-denied/);
});
