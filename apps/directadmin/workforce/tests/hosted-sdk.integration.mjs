import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createIdentitySessionRegistry } from '../../../../packages/titan-platform/.test-dist/security-boundary.js';
import { DirectAdminSessionBridge, DirectAdminCockpitSession, createDirectAdminGateway } from '../../../../packages/titan-platform/.test-dist/directadmin-plugin.js';
import { WorkforceApi } from '../images/api.mjs';
const require = createRequire(new URL('../../../../packages/titan-platform/package.json', import.meta.url));
const { tsImport } = await import(pathToFileURL(require.resolve('tsx/esm/api')));
const { createSqliteStorage } = await tsImport('../../../../packages/storage/src/index.ts', { parentURL: import.meta.url, tsconfig: false });
const controllerSource = (await readFile(new URL('../images/controller.mjs', import.meta.url), 'utf8')).replace("'workforce-presentation'", JSON.stringify(new URL('../images/presentation.mjs', import.meta.url).href));
const { WorkforceController } = await import(`data:text/javascript;base64,${Buffer.from(controllerSource).toString('base64')}`);
const origin = 'https://panel.fixture.test';
const b64 = bytes => Buffer.from(bytes).toString('base64url');

test('Workforce consumer traverses real signed SDK gateway and canonical registry revocation', async t => {
  // Ephemeral keys, identity rows and projection owner are integration fixtures only.
  const storage = createSqliteStorage(':memory:'); t.after(() => storage.close());
  const registry = await createIdentitySessionRegistry({ storage, storage_role: 'GLOBAL_REGISTRY' });
  const now = Math.floor(Date.now() / 1000);
  await registry.putActor({ actor_id: 'fixture-actor', status: 'active' }, null);
  await registry.putCompany({ company_id: 'fixture-company', status: 'active' }, null);
  await registry.putDevice({ actor_id: 'fixture-actor', device_id: 'fixture-device', status: 'active' }, null);
  await registry.putMembership({ actor_id: 'fixture-actor', company_id: 'fixture-company', role: 'member', status: 'active' }, null);
  await registry.putExternalBinding({ provider: 'fixture-da', subject: 'fixture-subject', binding_id: 'fixture-binding', actor_id: 'fixture-actor', company_id: 'fixture-company', status: 'active' }, null);
  const proof = { provider: 'fixture-da', subject: 'fixture-subject', session_id: 'fixture-session', device_id: 'fixture-device', session_revision: 1 };
  const current = await registry.issueSession({ ...proof, company_id: 'fixture-company', audience: 'fixture-audience', issued_at: new Date(now * 1000).toISOString(), expires_at: new Date((now + 600) * 1000).toISOString() }, new Date(now * 1000).toISOString());
  const keys = await crypto.subtle.generateKey('Ed25519', false, ['sign', 'verify']);
  const csrf = b64(crypto.getRandomValues(new Uint8Array(32)));
  const claims = { iss: 'fixture-da', sub: 'fixture-subject', aud: 'fixture-audience', node_id: 'fixture-node', session_id: proof.session_id, device_id: proof.device_id, session_revision: 1, company_id: current.company_id, actor_id: current.actor_id, context_revision: current.context_revision, da_role: 'admin', iat: now, exp: now + 120, csrf_sha256: b64(await crypto.subtle.digest('SHA-256', Buffer.from(csrf))) };
  const payload = `${b64(JSON.stringify({ alg: 'EdDSA', typ: 'titan-da-session+jwt', kid: 'fixture-key' }))}.${b64(JSON.stringify(claims))}`;
  const token = `${payload}.${b64(await crypto.subtle.sign('Ed25519', keys.privateKey, Buffer.from(payload)))}`;
  const bridge = new DirectAdminSessionBridge({ origin, issuer: 'fixture-da', audience: 'fixture-audience', node_id: 'fixture-node', verification_keys: new Map([['fixture-key', keys.publicKey]]), registry });
  const intents = [];
  const gateway = createDirectAdminGateway(bridge, {
    projection: async (plugin, context) => {
      assert.equal(plugin, 'titan_workforce'); const company_id = context.company_id;
      return { company_id, source: 'explicit-fixture-owner', freshness: null, evidence_refs: [], data: { schema: 'titan.workforce-cockpit.v1',
        discovery: { company_id, workers: [{ company_id, worker_id: 'fixture-worker', kind: 'digital' }], controls: [{ action: 'pause', capability_id: 'fixture.pause' }] },
        status: { company_id, work: [{ company_id, work_id: 'fixture-work', state: 'READY' }] } } };
    },
    requestIntent: async (plugin, intent, context, revalidate) => {
      assert.equal(plugin, 'titan_workforce'); assert.equal((await revalidate()).company_id, context.company_id);
      intents.push(intent); return { receipt_id: 'fixture-receipt' }; // ingress only, no effect/authority grant
    },
  });
  const session = new DirectAdminCockpitSession(() => csrf, (path, init) => gateway(new Request(origin + path, { ...init, headers: { ...init.headers, origin, 'sec-fetch-site': 'same-origin', cookie: `__Host-titan-da-session=${token}` } })));
  t.after(() => session.dispose());
  const controller = new WorkforceController(new WorkforceApi(session)); session.subscribe(() => controller.invalidate());
  await controller.connect(); assert.equal(controller.state.phase, 'ready');
  await controller.submit({ action: 'pause', work_id: 'fixture-work', reason: 'Fixture intent' });
  assert.equal(intents.length, 1); assert.equal(controller.state.receipt.state, 'REQUESTED');
  assert.equal(intents[0].company_id, 'fixture-company'); assert.equal(intents[0].actor_id, 'fixture-actor');
  await registry.revokeSession(proof.session_id, 1);
  await controller.submit({ action: 'pause', work_id: 'fixture-work', reason: 'Revoked fixture request' });
  assert.equal(intents.length, 1); assert.equal(controller.state.phase, 'denied'); assert.equal(controller.state.discovery, null);
});
