import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, rm, readFile, readdir, readlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash, randomBytes, webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';
import http from 'node:http';
import { WorkforceApi } from '../images/api.mjs';

const OWNER_HEAD = 'f6710e9d723e47d5dbda035309f9b8cd1de0cf4e';
const OWNER_TREE_SHA256 = 'a998aa751d059de466b2dcefeb11e2282d19b67e4432e73b890f858da3fd67d1';
const SDK_HEAD = 'aff115212281fb555d0c7bc804635e88713f2ec5';
const SDK_BUNDLE_SHA256 = 'f8ac44484b2285293cffe74903053d607414e12d3e6b428045ac42092ec84961';
const ownerRoot = requiredPath('TITAN_WORKFORCE_OWNER_ROOT');
const sdkPath = requiredPath('TITAN_COCKPIT_SDK_MODULE');
const ownerRequire = createRequire(pathToFileURL(join(ownerRoot, 'packages/titan-platform/package.json')));
const { SignJWT } = ownerRequire('jose');
const { tsImport } = ownerRequire('tsx/esm/api');
assert.equal(process.env.TITAN_WORKFORCE_OWNER_COMMIT, OWNER_HEAD,
  'this integration must use the live #1253 owner source head recorded in its evidence');
assert.equal(await sourceTreeSha256(ownerRoot), OWNER_TREE_SHA256,
  'the extracted owner source tree must match the recorded #1253 archive contents');
assert.equal(process.env.TITAN_COCKPIT_SDK_COMMIT, SDK_HEAD,
  'this integration must use the live #1252 shared SDK head recorded in its evidence');
assert.equal(createHash('sha256').update(await readFile(sdkPath)).digest('hex'), SDK_BUNDLE_SHA256,
  'the compiled SDK must match the byte-pinned artifact from the recorded #1252 head');
const SDK = await import(pathToFileURL(sdkPath).href);
const controllerSource = (await readFile(new URL('../images/controller.mjs', import.meta.url), 'utf8'))
  .replace("'workforce-presentation'", JSON.stringify(new URL('../images/presentation.mjs', import.meta.url).href));
const { WorkforceController } = await import(`data:text/javascript;base64,${Buffer.from(controllerSource).toString('base64')}`);

function requiredPath(name) {
  const value = process.env[name];
  assert.ok(value, `${name} must point to the exact extracted owner source or compiled SDK`);
  return resolve(value);
}
async function sourceTreeSha256(root) {
  const hash = createHash('sha256');
  async function visit(directory, relative = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
    for (const entry of entries) {
      if (entry.name === 'node_modules') continue;
      const pathFromRoot = relative ? `${relative}/${entry.name}` : entry.name;
      const absolute = join(directory, entry.name);
      hash.update(`${pathFromRoot}\0`);
      if (entry.isDirectory()) {
        hash.update('directory\0');
        await visit(absolute, pathFromRoot);
      } else if (entry.isSymbolicLink()) {
        hash.update('symlink\0');
        hash.update(await readlink(absolute));
        hash.update('\0');
      } else if (entry.isFile()) {
        hash.update('file\0');
        hash.update(await readFile(absolute));
        hash.update('\0');
      } else {
        throw new Error(`unsupported owner archive entry: ${pathFromRoot}`);
      }
    }
  }
  await visit(root);
  return hash.digest('hex');
}
function ownerFile(relative) { return pathToFileURL(join(ownerRoot, relative)).href; }
async function ownerTs(relative) {
  return tsImport(ownerFile(relative), { parentURL: import.meta.url, tsconfig: false });
}
function b64(value) { return Buffer.from(value).toString('base64url'); }
function count(result) { return Number(result.rows[0]?.total ?? 0); }
function queryLocal(address, pathname, init) {
  return new Promise((resolvePromise, reject) => {
    const request = http.request({ hostname: '127.0.0.1', port: address.port, path: pathname,
      method: init.method, headers: init.headers }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(Buffer.from(chunk)));
      response.on('end', () => {
        const headers = new Headers();
        for (const [name, value] of Object.entries(response.headers)) {
          if (Array.isArray(value)) headers.set(name, value.join(', '));
          else if (typeof value === 'string') headers.set(name, value);
        }
        resolvePromise(new Response(Buffer.concat(chunks), { status: response.statusCode ?? 500, headers }));
      });
    });
    request.once('error', reject);
    if (init.body !== undefined) request.end(init.body);
    else request.end();
  });
}
async function makeIdentityBridge(storage, origin) {
  const security = await ownerTs('packages/titan-platform/src/security-boundary.ts');
  const { DirectAdminSessionBridge } = await ownerTs('packages/titan-platform/src/directadmin-session-bridge.ts');
  const { createIdentitySessionRegistry, createSessionCredentialService,
    createSessionCredentialVerifier, directAdminIssuer } = security;
  const registry = await createIdentitySessionRegistry({ storage, storage_role: 'GLOBAL_REGISTRY' });
  const provider = directAdminIssuer(origin);
  const node_id = 'node-1050-owner-e2e';
  const device_id = 'device-1050-owner-e2e';
  const actor_id = 'actor-1050-owner-e2e';
  const audience = 'titan-login:node-1050-owner-e2e';
  const upstream = await webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const directadmin = await webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const workforce = await webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const upstreamTrust = { issuer: provider, audience, key_id: 'upstream-e2e', algorithm: 'EdDSA', verification_key: upstream.publicKey };
  const daAudience = 'titan-directadmin:node-1050-owner-e2e';
  const csrf = b64(randomBytes(32));
  const csrf_sha256 = b64(createHash('sha256').update(csrf).digest());
  const now = Math.floor(Date.now() / 1000);
  const currentTime = () => new Date();

  await registry.putActor({ actor_id, status: 'active' }, null);
  await registry.putDevice({ actor_id, device_id, status: 'active' }, null);
  for (const company_id of ['company-a', 'company-b']) {
    await registry.putCompany({ company_id, status: 'active' }, null);
    await registry.putMembership({ actor_id, company_id, role: 'owner', status: 'active' }, null);
    await registry.putExternalBinding({ provider, subject: 'human-1050-e2e', binding_id: `binding-${company_id}`,
      actor_id, company_id, status: 'active' }, null);
  }

  const directadminService = createSessionCredentialService({ registry, upstream: upstreamTrust,
    issuer: 'titan:node-1050-owner-e2e', audience: daAudience, key_id: 'da-e2e', algorithm: 'EdDSA',
    verification_key: directadmin.publicKey, signing_key: directadmin.privateKey,
    directadmin: { node_id }, lifetime_seconds: 300,
    workforce_zero_exchange: { issuer: 'titan:workforce', key_id: 'workforce-e2e', algorithm: 'EdDSA',
      verification_key: workforce.publicKey, signing_key: workforce.privateKey, lifetime_seconds: 120 },
    now: currentTime });
  const workforceVerifier = createSessionCredentialVerifier({ registry, upstream: upstreamTrust,
    issuer: 'titan:workforce', audience: 'workforce', key_id: 'workforce-e2e', algorithm: 'EdDSA',
    verification_key: workforce.publicKey, lifetime_seconds: 120, directadmin: { node_id }, now: currentTime });
  const login = await new SignJWT({ company_id: 'company-a', device_id, jti: `login-${randomBytes(12).toString('hex')}`,
    node_id, da_role: 'user', csrf_sha256 })
    .setProtectedHeader({ alg: 'EdDSA', kid: 'upstream-e2e', typ: 'titan-login+jwt' })
    .setIssuer(provider).setAudience(audience).setSubject('human-1050-e2e')
    .setIssuedAt(now).setExpirationTime(now + 120).sign(upstream.privateKey);
  const issued = await directadminService.issue(login, { company_id: 'company-a', device_id });
  const bridge = new DirectAdminSessionBridge({ origin, audience: daAudience, node_id, sessions: directadminService });
  return { registry, bridge, workforceVerifier, csrf, token: issued.credential, actor_id, device_id };
}

async function makeHarness() {
  const scratch = await mkdtemp(join(tmpdir(), '1050-actual-owner-'));
  let host;
  let server;
  let seedStorage;
  let identityStorage;
  let placementStorage;
  let session;
  let unsubscribe;
  const intentResponses = [];
  const close = async () => {
    session?.dispose();
    unsubscribe?.();
    try { server?.closeAllConnections(); } catch { /* already closed */ }
    await host?.close().catch(() => {});
    await seedStorage?.close().catch(() => {});
    await placementStorage?.close().catch(() => {});
    await identityStorage?.close().catch(() => {});
    await rm(scratch, { recursive: true, force: true });
  };
  try {
    const { createSqliteStorage, initializeSqliteCompanyPlacementRegistry,
      createSqliteCompanyPlacementRegistry, createSqliteCompanyStoreOpener } = await ownerTs('packages/storage/src/index.ts');
    const { createWorkforceServer } = await ownerTs('services/workforce/src/server.ts');
    const { SqliteWorkforceStore } = await ownerTs('services/workforce/src/sqlite-store.ts');
    const { SqliteWorkerAccessStore, SqliteAuthorityStore } = await import(ownerFile('packages/runtime/authority/index.mjs'));
    const identityPath = join(scratch, 'identity.sqlite');
    const workforcePath = join(scratch, 'workforce.sqlite');
    identityStorage = createSqliteStorage(identityPath);
    const auth = await makeIdentityBridge(identityStorage, 'https://panel.example.test');
    await initializeSqliteCompanyPlacementRegistry({ storage: identityStorage, storage_role: 'GLOBAL_REGISTRY' });
    for (const [company_id, placement_id] of [['company-a', 'fixture-company-a'], ['company-b', 'fixture-company-b']]) {
      await identityStorage.query(`INSERT INTO titan_company_storage_placements
        (company_id,placement_id,placement_revision,provider,schema_version,status)
        VALUES ($1,$2,1,'sqlite','native-fsm/1','READY')`, [company_id, placement_id]);
    }
    placementStorage = createSqliteStorage(identityPath);
    const companyPlacementRegistry = await createSqliteCompanyPlacementRegistry({ storage: placementStorage, storage_role: 'GLOBAL_REGISTRY' });
    const companyStoreRoot = join(scratch, 'company-stores');
    await mkdir(companyStoreRoot, { mode: 0o700 });
    const companyStoreOpener = createSqliteCompanyStoreOpener({ companyStoreRoot });

    const credentialVerifier = {
      async verify(authorization, options = {}) {
        options.signal?.throwIfAborted();
        const match = /^Bearer ([A-Za-z0-9_.-]{1,16384})$/.exec(authorization ?? '');
        if (!match) throw new Error('authentication-denied');
        const value = await auth.workforceVerifier.authenticate(match[1]);
        options.signal?.throwIfAborted();
        return { provider: value.provider, subject: value.subject, session_id: value.context.session_id,
          device_id: value.context.device_id, session_revision: value.context.session_revision,
          credential_expires_at: value.credential_expires_at, source_session: value.source_session,
          audience: value.context.audience, surface: value.surface };
      },
    };
    host = await createWorkforceServer({ storagePath: workforcePath, dependencies: {
      identityStoragePath: identityPath, credentialVerifier, companyPlacementRegistry, companyStoreOpener,
      workOrders: { async read() { throw new Error('unexpected-owner-e2e-work-order-read'); },
        async complete() { throw new Error('unexpected-owner-e2e-work-order-complete'); } },
      readiness: async () => ({ authentication: true, authority: true, provider: true, evidence: true }),
      directAdmin: { publicOrigin: 'https://panel.example.test',
        createGateway: owners => SDK.createDirectAdminGateway(auth.bridge, owners) },
    } });
    server = host.server;
    const address = await new Promise((resolvePromise, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => resolvePromise(server.address()));
    });

    seedStorage = createSqliteStorage(workforcePath);
    const workforceStore = new SqliteWorkforceStore(seedStorage);
    await workforceStore.migrate();
    const at = new Date().toISOString();
    const managerWorker = 'manager-worker-a';
    const workers = [
      { company_id: 'company-a', worker_id: managerWorker, kind: 'human', active: true, capabilities: [], human_identity_ref: auth.actor_id },
      { company_id: 'company-a', worker_id: 'worker-old', kind: 'digital', active: true, capabilities: ['work.assign'] },
      { company_id: 'company-a', worker_id: 'worker-target', kind: 'digital', active: true, capabilities: ['work.assign'] },
      { company_id: 'company-a', worker_id: 'worker-other', kind: 'digital', active: true, capabilities: ['work.assign'] },
      { company_id: 'company-a', worker_id: 'worker-race', kind: 'digital', active: true, capabilities: ['work.assign'] },
      { company_id: 'company-b', worker_id: 'worker-b', kind: 'digital', active: true, capabilities: ['work.assign'] },
    ];
    for (const worker of workers) await workforceStore.putWorker(worker);
    const item = (company_id, work_id, assignee, evidence_refs = []) => ({ company_id, work_id,
      objective: `Disposable ${company_id} ${work_id}`, creator: auth.actor_id, assignee, priority: 1, state: 'READY',
      dependencies: [], required_capabilities: ['work.assign'], context_refs: [`context-${work_id}`], evidence_refs,
      created_at: at, updated_at: at });
    await workforceStore.put(item('company-a', 'work-a', 'worker-old'));
    await workforceStore.put(item('company-b', 'work-b', 'worker-b', ['company-b-private-evidence']));

    const accessStore = new SqliteWorkerAccessStore(seedStorage);
    const authority = new SqliteAuthorityStore(seedStorage);
    async function grantOperation(operationId) {
      const granted_at = new Date().toISOString();
      const expires_at = new Date(Date.now() + 60 * 60_000).toISOString();
      const subject_id = `${managerWorker}/titan.workforce.reassign`;
      const proofId = 'explicit-e2e-management-proof';
      const grant = { company_id: 'company-a', worker_id: managerWorker, actor_id: auth.actor_id,
        capability: 'titan.workforce.reassign', status: 'active', policy_allows: true,
        governance_allows: true, assurance_allows: true, risk: 'low', expires_at, evidence_refs: [proofId] };
      const existingProof = await seedStorage.query('SELECT id FROM evidence WHERE company_id=$1 AND id=$2', ['company-a', proofId]);
      if (existingProof.rowCount === 0) await seedStorage.query(
        `INSERT INTO evidence(id,company_id,subject_type,subject_id,evidence_type,provenance,payload)
         VALUES($1,$2,'worker_capability',$3,'management_authority',$4,$5)`,
        [proofId, 'company-a', subject_id, JSON.stringify({ source: 'isolated-owner-e2e', grants_authority: false }), JSON.stringify({ verified: true })]);
      const existingGrant = await seedStorage.query('SELECT id FROM authority_state WHERE company_id=$1 AND subject_type=$2 AND subject_id=$3',
        ['company-a', 'worker_capability', subject_id]);
      if (existingGrant.rowCount === 0) await seedStorage.query(
        `INSERT INTO authority_state(id,company_id,subject_type,subject_id,level,envelope)
         VALUES($1,$2,'worker_capability',$3,'scoped',$4)`,
        ['explicit-e2e-management-grant', 'company-a', subject_id, JSON.stringify(grant)]);
      const existingAccess = await accessStore.latest({ company_id: 'company-a', worker_id: managerWorker });
      if (!existingAccess) await accessStore.append({ company_id: 'company-a', assignment_id: 'e2e-manager-access',
        worker_id: managerWorker, permissions: ['titan.workforce.reassign'], status: 'active', granted_by: 'test-owner-fixture',
        granted_at, expires_at });
      const autonomy = await authority.latestAutonomySnapshot({ company_id: 'company-a', worker_id: managerWorker,
        capability: 'titan.workforce.reassign' });
      if (!autonomy) await authority.appendAutonomySnapshot({ company_id: 'company-a', decision_id: 'e2e-manager-autonomy',
        capability: 'titan.workforce.reassign', effective_score: 60, status: 'verified', source: 'titan-autonomy',
        verified_at: granted_at, expires_at, trusted_auto_handshake: { platform: false, user: false, assurance: false },
        predictive_ready: false }, { worker_id: managerWorker });
      await authority.appendApproval({ company_id: 'company-a', approval_id: `e2e-approval-${operationId}`,
        approval_scope: operationId, status: 'approved', approver_id: 'test-human-approver', granted_at, expires_at });
    }
    await grantOperation('operation-success');

    let cookie = auth.token;
    let nextIntentHook = null;
    const fetcher = async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url, 'https://panel.example.test');
      const headers = new Headers(init.headers);
      const outgoing = Object.fromEntries(headers.entries());
      Object.assign(outgoing, { host: 'panel.example.test', origin: 'https://panel.example.test',
        referer: 'https://panel.example.test/', 'sec-fetch-site': 'same-origin',
        'x-titan-csrf': auth.csrf, cookie: `__Host-titan-da-session=${cookie}`, accept: 'application/json' });
      if (url.pathname.endsWith('/intents') && nextIntentHook) {
        const hook = nextIntentHook;
        nextIntentHook = null;
        await hook();
      }
      const response = await queryLocal(address, `${url.pathname}${url.search}`, {
        method: init.method ?? 'GET', headers: outgoing, body: init.body,
      });
      if (url.pathname.endsWith('/intents')) {
        intentResponses.push({ status: response.status, body: await response.clone().text() });
      }
      const setCookie = response.headers.get('set-cookie');
      const updatedCookie = setCookie?.match(/(?:^|,\s*)__Host-titan-da-session=([^;]+)/)?.[1];
      if (updatedCookie) cookie = updatedCookie;
      return response;
    };
    session = new SDK.DirectAdminCockpitSession(() => auth.csrf, fetcher);
    const requestIds = [];
    let fallbackId = 0;
    const api = new WorkforceApi(session, () => requestIds.shift() ?? `unexpected-id-${++fallbackId}`);
    const controller = new WorkforceController(api);
    unsubscribe = session.subscribe(() => controller.invalidate());

    return { scratch, host, server, address, auth, seedStorage, identityStorage, placementStorage,
      workforceStore, accessStore, authority, grantOperation, session, controller, requestIds, intentResponses,
      setBeforeNextIntent(hook) { nextIntentHook = hook; }, async close() {
        await close();
      } };
  } catch (error) {
    await close();
    throw error;
  }
}

test('actual #1050 consumer and shared SDK traverse #1049 gateway into #1253 SQLite owner', async t => {
  const h = await makeHarness();
  t.after(() => h.close());

  await h.controller.connect();
  assert.equal(h.controller.state.phase, 'ready', h.controller.state.error);
  assert.equal(h.controller.state.context.company_id, 'company-a');
  assert.deepEqual(h.controller.state.discovery.controls, [{ capability_id: 'titan.workforce.reassign',
    action: 'reassign', requires_fresh_approval: true, grants_authority: false }]);
  assert.deepEqual(h.controller.state.status.work.map(work => work.work_id), ['work-a']);

  await t.test('owner projection exposes required capabilities to the consumer filter', async () => {
    assert.deepEqual(h.controller.state.status.work[0].required_capabilities, ['work.assign'],
      '#1253 projectWork must carry canonical WorkItem.required_capabilities');
  });

  h.requestIds.push('operation-success', 'correlation-success');
  await h.controller.submit({ action: 'reassign', work_id: 'work-a', target_worker_id: 'worker-target', reason: 'Balance the ready queue' });
  assert.equal(h.controller.state.phase, 'ready', h.controller.state.error);
  assert.equal(h.controller.state.receipt.state, 'REQUESTED', 'gateway ingress receipt is not business verification');
  assert.deepEqual(h.controller.state.receipt.evidence_refs, [], 'the consumer does not invent accepted evidence');
  assert.equal(h.controller.state.status.work[0].assignee, 'worker-target');
  const acceptedRefs = h.controller.state.status.work[0].evidence_refs;
  assert.equal(acceptedRefs.length, 1, 'only refreshed canonical projection displays the owner-persisted accepted evidence');
  const acceptedId = acceptedRefs[0];
  assert.equal(h.controller.state.receipt.receipt_id, acceptedId,
    'the request receipt resolves to the persisted owner evidence only after canonical reread');
  assert.deepEqual(await h.workforceStore.get('company-a', 'work-a').then(work => ({ state: work.state, assignee: work.assignee })),
    { state: 'READY', assignee: 'worker-target' });

  const acceptedRows = await h.seedStorage.query(
    `SELECT payload,provenance FROM evidence WHERE company_id=$1 AND id=$2 AND evidence_type='gateway_execution'`,
    ['company-a', acceptedId]);
  assert.equal(acceptedRows.rowCount, 1, 'accepted evidence is read from the canonical SQLite evidence ledger');
  const accepted = JSON.parse(acceptedRows.rows[0].payload);
  const provenance = JSON.parse(acceptedRows.rows[0].provenance);
  assert.equal(accepted.state, 'VERIFIED');
  assert.equal(accepted.accepted_evidence.schema, 'titan.business.accepted-evidence/v1');
  assert.equal(provenance.company_id, 'company-a');
  assert.equal(provenance.actor_id, h.auth.actor_id);
  assert.equal(provenance.work_id, 'work-a');
  assert.equal(provenance.workforce_session_id, accepted.request_summary.input.workforce_session_id);
  assert.equal(provenance.workforce_context_revision, accepted.request_summary.input.workforce_context_revision);
  assert.ok(provenance.workforce_session_id.startsWith('workforce-zero-'), 'the accepted record names the signed #302 derived child session');
  assert.ok(provenance.workforce_session_id !== h.controller.state.context.session_id,
    'the authority/evidence path records the bound child session, not the DirectAdmin parent credential');
  assert.equal((await h.seedStorage.query(
    "SELECT event_seq FROM workforce_events WHERE company_id=$1 AND work_id=$2 AND type='work.reassigned'",
    ['company-a', 'work-a'])).rowCount, 1);

  await t.test('same operation replays the durable accepted result without duplicate effects', async () => {
    const context = await h.session.connect();
    const replay = await h.session.intent('titan_workforce', { company_id: context.company_id, actor_id: context.actor_id,
      capability_id: 'titan.workforce.reassign', operation_id: 'operation-success', correlation_id: 'correlation-success',
      input: { action: 'reassign', work_id: 'work-a', reason: 'Balance the ready queue',
        expected_assignee_id: 'worker-old', target_worker_id: 'worker-target' } });
    assert.equal(replay.receipt_id, acceptedId);
    assert.equal((await h.seedStorage.query(
      "SELECT event_seq FROM workforce_events WHERE company_id=$1 AND work_id=$2 AND type='work.reassigned'",
      ['company-a', 'work-a'])).rowCount, 1);
    assert.equal((await h.seedStorage.query(
      "SELECT id FROM evidence WHERE company_id=$1 AND evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'",
      ['company-a'])).rowCount, 1);
  });

  await h.controller.connect();
  h.requestIds.push('operation-denied', 'correlation-denied');
  h.setBeforeNextIntent(async () => {
    await h.accessStore.append({ company_id: 'company-a', assignment_id: 'e2e-manager-access-revoked',
      worker_id: 'manager-worker-a', permissions: ['titan.workforce.reassign'], status: 'revoked',
      granted_by: 'test-owner-fixture', granted_at: new Date(Date.now() + 1000).toISOString(),
      expires_at: new Date(Date.now() + 60 * 60_000).toISOString(), supersedes_assignment_id: 'e2e-manager-access' });
  });
  await h.controller.submit({ action: 'reassign', work_id: 'work-a', target_worker_id: 'worker-other', reason: 'Should be denied after access revocation' });
  const denialResponse = h.intentResponses.at(-1);
  await t.test('typed owner authority denial is HTTP 403, sanitized, and distinct from an unknown outcome', async () => {
    assert.equal(denialResponse?.status, 403);
    assert.ok(denialResponse.body.length < 1024);
    assert.doesNotMatch(denialResponse.body, /SQLite|SELECT|authority_state|management-proof/i);
    assert.equal(h.controller.state.phase, 'ready');
    assert.equal(h.controller.state.context.company_id, 'company-a');
    assert.equal(h.controller.state.status.work[0].assignee, 'worker-target');
    assert.equal(h.controller.state.receipt, null);
    assert.match(h.controller.state.error, /host denied that request/i);
    assert.deepEqual(h.controller.state.discovery.controls, [], 'a refreshed projection hides the revoked control');
  });
  assert.equal((await h.workforceStore.get('company-a', 'work-a')).assignee, 'worker-target');
  assert.equal((await h.seedStorage.query(
    "SELECT event_seq FROM workforce_events WHERE company_id=$1 AND work_id=$2 AND type='work.reassigned'",
    ['company-a', 'work-a'])).rowCount, 1, 'denial adds no reassignment event');
  assert.deepEqual((await h.workforceStore.get('company-a', 'work-a')).evidence_refs, acceptedRefs,
    'denial adds no accepted evidence reference');

  await h.accessStore.append({ company_id: 'company-a', assignment_id: 'e2e-manager-access-restored',
    worker_id: 'manager-worker-a', permissions: ['titan.workforce.reassign'], status: 'active',
    granted_by: 'test-owner-fixture', granted_at: new Date(Date.now() + 2000).toISOString(),
    expires_at: new Date(Date.now() + 60 * 60_000).toISOString(), supersedes_assignment_id: 'e2e-manager-access-revoked' });
  await h.grantOperation('operation-stale');
  await h.controller.connect();
  assert.equal(h.controller.state.phase, 'ready', h.controller.state.error);
  h.requestIds.push('operation-stale', 'correlation-stale');
  h.setBeforeNextIntent(async () => {
    const current = await h.workforceStore.get('company-a', 'work-a');
    await h.workforceStore.put({ ...current, assignee: 'worker-race', updated_at: new Date(Date.now() + 3000).toISOString() });
  });
  await h.controller.submit({ action: 'reassign', work_id: 'work-a', target_worker_id: 'worker-other', reason: 'Stale assignee compare-and-set' });
  await t.test('stale assignee CAS produces no owner effect or accepted evidence', async () => {
    assert.equal((await h.workforceStore.get('company-a', 'work-a')).assignee, 'worker-race',
      'the competing fixture update remains current; the attempted assignment did not overwrite it');
    assert.equal((await h.seedStorage.query(
      "SELECT event_seq FROM workforce_events WHERE company_id=$1 AND work_id=$2 AND type='work.reassigned'",
      ['company-a', 'work-a'])).rowCount, 1, 'stale CAS creates no second reassignment event');
    assert.deepEqual((await h.workforceStore.get('company-a', 'work-a')).evidence_refs, acceptedRefs);
    assert.equal((await h.seedStorage.query(
      "SELECT id FROM evidence WHERE company_id=$1 AND evidence_type='gateway_execution' AND json_extract(payload,'$.idempotency_key')=$2 AND json_extract(payload,'$.state')='VERIFIED'",
      ['company-a', 'titan.workforce.reassign:operation-stale'])).rowCount, 0, 'stale CAS is never reported as verified');
  });

  await h.session.switchCompany('company-b');
  await t.test('company switch clears prior company state and refresh is company filtered', async () => {
    assert.equal(h.controller.state.context, null);
    assert.equal(h.controller.state.discovery, null);
    assert.equal(h.controller.state.status, null);
    assert.doesNotMatch(JSON.stringify(h.controller.state), /work-a|worker-target|explicit-e2e-management-proof/);
  });
  await h.controller.connect();
  assert.equal(h.controller.state.phase, 'ready', h.controller.state.error);
  assert.equal(h.controller.state.context.company_id, 'company-b');
  assert.deepEqual(h.controller.state.status.work.map(work => work.work_id), ['work-b']);
  assert.deepEqual(h.controller.state.status.work[0].evidence_refs, ['company-b-private-evidence']);
  assert.deepEqual(h.controller.state.discovery.controls, [], 'company A authority/access does not follow the company switch');
  assert.doesNotMatch(JSON.stringify(h.controller.state), /work-a|worker-target|explicit-e2e-management-proof/);
});
