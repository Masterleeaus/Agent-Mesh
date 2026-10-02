import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { spawn } from 'node:child_process';
import { lstat, mkdtemp, mkdir, readFile, rm, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { once } from 'node:events';
import { PassThrough } from 'node:stream';
import https from 'node:https';
import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const scratch = await mkdtemp(join(tmpdir(), '1050-relay-host-'));
const upstreamRoot = requiredPath('TITAN_WORKFORCE_HOST_ROOT');
const relaySourceRoot = requiredPath('TITAN_SERVER_NODE_SOURCE_ROOT');
const hostSdkModulePath = process.env.TITAN_HOST_SDK_MODULE
  ? resolve(process.env.TITAN_HOST_SDK_MODULE)
  : join(repo, 'packages/titan-platform/.test-dist/directadmin-plugin.js');
const bridgeFixturePath = process.env.TITAN_BRIDGE_FIXTURE_MODULE
  ? resolve(process.env.TITAN_BRIDGE_FIXTURE_MODULE)
  : join(repo, 'packages/titan-platform/tests/fixtures/directadmin-bridge-fixture.mjs');
const relayRoot = join(scratch, 'relay-extracted');
const relayArchiveRoot = join(scratch, 'relay-package');
const browserPackage = join(scratch, 'workforce-extracted');
const workforceArchiveRoot = join(scratch, 'workforce-package');
const certPath = join(scratch, 'panel.crt');
const keyPath = join(scratch, 'panel.key');
const lifecycleCallbacks = [];
let host;
let panel;
let browser;
let relayCore;
let relayFixtureConfig = null;
const cleanup = [];
const relayObservations = [];
const panelObservations = [];
const hostedObservations = [];

function requiredPath(name) {
  const value = process.env[name];
  assert.ok(value, `${name} must point to a disposable extraction of the published owner source`);
  return resolve(value);
}

function safeError(error) {
  return error instanceof Error ? error.message.replace(/[\r\n]/g, ' ').slice(0, 240) : 'unknown-error';
}
function listen(server, hostName) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, hostName, () => resolve(server.address()));
  });
}
function nodeHttpFetch(url, options) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method: options.method ?? 'GET', headers: options.headers }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: response.statusCode, headers: response.headers })));
    });
    request.once('error', reject);
    request.end(options.body);
  });
}
function parseRaw(bytes) {
  const marker = bytes.indexOf(Buffer.from('\r\n\r\n'));
  assert.notEqual(marker, -1, 'RAW relay response framing is complete');
  const lines = bytes.subarray(0, marker).toString('latin1').split('\r\n');
  const status = Number(lines.shift().split(' ')[1]);
  assert.ok(status >= 100 && status <= 599, 'RAW relay returned an HTTP status');
  const headers = Object.create(null);
  for (const line of lines) {
    const split = line.indexOf(':');
    if (split < 1) continue;
    const name = line.slice(0, split).toLowerCase();
    (headers[name] ??= []).push(line.slice(split + 1).trim());
  }
  const body = bytes.subarray(marker + 4);
  assert.equal(Number(headers['content-length']?.[0]), body.length, 'RAW Content-Length matches the response body');
  return { status, headers, body };
}
async function runRelayCore(env, input) {
  const stdin = new PassThrough();
  const chunks = [];
  const stdout = { write(chunk) { chunks.push(Buffer.from(chunk)); return true; } };
  stdin.end(input);
  const options = { env, stdin, stdout };
  // The production default is used for the denied/unconfigured request. The
  // fake config loader is injected only for explicit in-process fixture runs.
  if (relayFixtureConfig) options.configLoader = async () => relayFixtureConfig;
  await relayCore.runRawGateway(options);
  return parseRaw(Buffer.concat(chunks));
}
function cgiEnv(request, query, body) {
  const headers = request.headers;
  const lines = [];
  const copy = (name, label) => { const value = headers[name]; if (typeof value === 'string') lines.push(`${label}: ${value}`); };
  copy('host', 'Host');
  copy('cookie', 'Cookie');
  copy('sec-fetch-site', 'Sec-Fetch-Site');
  copy('origin', 'Origin');
  copy('referer', 'Referer');
  copy('x-titan-csrf', 'X-Titan-CSRF');
  copy('accept', 'Accept');
  copy('content-type', 'Content-Type');
  copy('content-length', 'Content-Length');
  const env = {
    PATH: process.env.PATH,
    NODE_ENV: 'test',
    REQUEST_METHOD: request.method,
    QUERY_STRING: query,
    HEADERS: encodeURIComponent(lines.join('\r\n')),
  };
  if (request.method === 'POST') {
    env.POST = 'stdin=true';
    env.CONTENT_LENGTH = String(body.byteLength);
    if (typeof headers['content-type'] === 'string') env.CONTENT_TYPE = headers['content-type'];
  }
  return env;
}

try {
  const sdkModulePath = requiredPath('TITAN_COCKPIT_SDK_MODULE');
  const { buildPackage } = await import(pathToFileURL(join(repo, 'apps/directadmin/workforce/tools/package.mjs')).href);
  const workforcePackage = await buildPackage({ outputDir: workforceArchiveRoot, sdkModulePath });
  await mkdir(browserPackage, { recursive: true });
  execFileSync('tar', ['-xzf', workforcePackage.archivePath, '-C', browserPackage]);
  const roleHtml = execFileSync(join(browserPackage, 'user/index.html'), [], { encoding: 'utf8' });
  const { packagePlugin } = await import(pathToFileURL(join(relaySourceRoot, 'scripts/package-directadmin-plugin.mjs')).href);
  const relayPackage = packagePlugin({ sourceDir: join(relaySourceRoot, 'apps/directadmin/server-node'), outputDir: relayArchiveRoot });
  await mkdir(relayRoot, { recursive: true });
  execFileSync('tar', ['-xzf', relayPackage.archive, '-C', relayRoot]);
  const relayManifest = await readFile(join(relayRoot, 'plugin.conf'), 'utf8');
  assert.match(relayManifest, /^version=0\.3\.0$/m, 'integration extracts the current Server Node relay contract');
  const relayClient = await readFile(join(relayRoot, 'images/directadmin-relay-client.mjs'), 'utf8');
  relayCore = await import(`${pathToFileURL(join(relayRoot, 'directadmin-relay.mjs')).href}?fixture=${encodeURIComponent(scratch)}`);
  const certResult = spawn('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyPath, '-out', certPath,
    '-subj', '/CN=127.0.0.1', '-days', '1', '-addext', 'subjectAltName=IP:127.0.0.1'], { stdio: 'ignore' });
  const [certCode] = await once(certResult, 'close');
  assert.equal(certCode, 0, 'disposable TLS fixture certificate generated');
  const tls = { key: await readFile(keyPath), cert: await readFile(certPath) };

  panel = https.createServer(tls, async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'https://127.0.0.1');
      panelObservations.push({ method: request.method, path: url.pathname });
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      if (url.pathname === '/') {
        const csrf = panel.fixtureCsrf;
        const html = roleHtml.replace('<main ', `<meta name="titan-directadmin-csrf" content="${csrf}"><main `);
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        response.end(html);
        return;
      }
      if (url.pathname === '/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs') {
        response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' });
        response.end(relayClient);
        return;
      }
      if (url.pathname === '/CMD_PLUGINS/titan-server-node/directadmin-gateway.raw') {
        const route = url.searchParams.get('route') ?? 'invalid';
        const origin = typeof request.headers.origin === 'string' ? new URL(request.headers.origin).origin : null;
        const refererOrigin = typeof request.headers.referer === 'string' ? new URL(request.headers.referer).origin : null;
        const observation = { method: request.method, route, host: request.headers.host, cookiePresent: Boolean(request.headers.cookie),
          titanCookiePresent: request.headers.cookie?.includes('__Host-titan-da-session=') === true,
          secFetchSite: request.headers['sec-fetch-site'] ?? null, csrfLength: request.headers['x-titan-csrf']?.length ?? 0,
          accept: request.headers.accept ?? null, origin, refererOrigin, contentType: request.headers['content-type'] ?? null,
          contentLength: request.headers['content-length'] ?? null, transferEncoding: request.headers['transfer-encoding'] ?? null,
          bodyLength: body.byteLength };
        if (request.method === 'POST') {
          try {
            const payload = JSON.parse(body.toString('utf8'));
            const required = ['company_id', 'actor_id', 'context_revision', 'capability_id', 'operation_id', 'correlation_id'];
            observation.bodyKeys = Object.keys(payload).sort();
            observation.identifierChecks = Object.fromEntries(required.map(key => [key, {
              type: typeof payload[key], length: typeof payload[key] === 'string' ? payload[key].length : null,
              valid: typeof payload[key] === 'string' && /^[A-Za-z0-9:._-]{1,200}$/.test(payload[key]),
            }]));
            observation.inputIsObject = Boolean(payload.input && typeof payload.input === 'object' && !Array.isArray(payload.input));
          } catch { observation.bodyKeys = ['invalid-json']; }
        }
        relayObservations.push(observation);
        const result = await runRelayCore(cgiEnv(request, url.search.slice(1), body), body);
        observation.status = result.status;
        try { observation.code = JSON.parse(result.body.toString('utf8')).error ?? null; } catch { observation.code = 'non-json-response'; }
        const outgoingHeaders = Object.create(null);
        for (const [name, values] of Object.entries(result.headers)) {
          outgoingHeaders[name] = name === 'set-cookie' ? values : values[0];
        }
        response.writeHead(result.status, outgoingHeaders);
        response.end(result.body);
        return;
      }
      response.writeHead(404, { 'cache-control': 'no-store' });
      response.end();
    } catch {
      if (!response.headersSent) { response.writeHead(500, { 'cache-control': 'no-store' }); response.end('{"error":"fixture-host-failed"}'); }
      else response.destroy();
    }
  });
  const panelAddress = await listen(panel, '127.0.0.1');
  const panelOrigin = `https://127.0.0.1:${panelAddress.port}`;

  for (const relative of ['', 'packages/titan-platform', 'packages/storage', 'services/workforce']) {
    const target = join(upstreamRoot, relative, 'node_modules');
    let targetExists = false;
    try { await lstat(target); targetExists = true; }
    catch (error) { if (error?.code !== 'ENOENT') throw error; }
    if (!targetExists) {
      await mkdir(dirname(target), { recursive: true });
      await symlink(join(repo, relative, 'node_modules'), target, 'dir');
    }
  }

  const upstreamServerTs = pathToFileURL(join(upstreamRoot, 'services/workforce/src/server.ts')).href;
  const upstreamStorageTs = pathToFileURL(join(upstreamRoot, 'packages/storage/src/index.ts')).href;
  const upstreamStoreTs = pathToFileURL(join(upstreamRoot, 'services/workforce/src/sqlite-store.ts')).href;
  const [{ createWorkforceServer }, storageApi, { SqliteWorkforceStore }] = await Promise.all([
    import(upstreamServerTs), import(upstreamStorageTs), import(upstreamStoreTs),
  ]);
  const { createSqliteStorage, initializeSqliteCompanyPlacementRegistry,
    createSqliteCompanyPlacementRegistry, createSqliteCompanyStoreOpener } = storageApi;
  const dbPath = join(scratch, 'workforce.db');
  const seedStorage = createSqliteStorage(dbPath);
  const store = new SqliteWorkforceStore(seedStorage);
  await store.migrate();
  const timestamp = new Date().toISOString();
  for (const company_id of ['company-a', 'company-b']) {
    const worker_id = `fixture-${company_id}-worker`;
    await store.putWorker({ company_id, worker_id, kind: 'digital', active: true, capabilities: ['work.pause'] });
    await store.put({ company_id, work_id: `fixture-${company_id}-work`, objective: `Disposable ${company_id} work`,
      creator: 'fixture-operator', assignee: worker_id, priority: 1, state: 'IN_PROGRESS', dependencies: [],
      required_capabilities: ['work.pause'], context_refs: [`fixture-context-${company_id}`],
      evidence_refs: [`fixture-evidence-${company_id}`], created_at: timestamp, updated_at: timestamp });
  }
  await seedStorage.close();

  const bridgeFixture = await import(pathToFileURL(bridgeFixturePath).href);
  const auth = await bridgeFixture.fixture({ after: cleanupFn => lifecycleCallbacks.push(cleanupFn) }, {
    origin: panelOrigin, provider: `directadmin:${panelOrigin}`,
  });
  panel.fixtureCsrf = bridgeFixture.csrf;
  const { createDirectAdminGateway } = await import(pathToFileURL(hostSdkModulePath).href);
  // #811's current hosted runtime requires the canonical company-placement
  // ports even though this read-only projection fixture never opens a company
  // business store. The registry records below exist only in this disposable
  // test database; the canonical SQLite adapter owns their schema and reads.
  const identityStoragePath = join(scratch, 'identity.db');
  const placementRegistryStorage = createSqliteStorage(identityStoragePath);
  cleanup.push(() => placementRegistryStorage.close());
  await initializeSqliteCompanyPlacementRegistry({ storage: placementRegistryStorage, storage_role: 'GLOBAL_REGISTRY' });
  for (const [company_id, placement_id] of [['company-a', 'fixture-placement-a'], ['company-b', 'fixture-placement-b']]) {
    await placementRegistryStorage.query(
      `INSERT INTO titan_company_storage_placements
        (company_id, placement_id, placement_revision, provider, schema_version, status)
       VALUES ($1, $2, 1, 'sqlite', 'native-fsm/1', 'READY')`,
      [company_id, placement_id],
    );
  }
  const companyPlacementRegistry = await createSqliteCompanyPlacementRegistry({ storage: placementRegistryStorage, storage_role: 'GLOBAL_REGISTRY' });
  const companyStoreRoot = join(scratch, 'company-stores');
  await mkdir(companyStoreRoot, { recursive: true, mode: 0o700 });
  const companyStoreOpener = createSqliteCompanyStoreOpener({ companyStoreRoot });
  assert.equal((await companyPlacementRegistry.findByCompanyId('company-a'))?.company_id, 'company-a');
  assert.equal(await companyPlacementRegistry.findByCompanyId('unrelated-company'), null, 'placement lookup fails closed for unknown company IDs');
  const hostDeps = {
    identityStoragePath,
    credentialVerifier: { async verify() { throw new Error('not-used-by-directadmin-fixture'); } },
    companyPlacementRegistry,
    companyStoreOpener,
    workOrders: { async read() { throw new Error('not-used-by-read-only-projection'); }, async complete() { throw new Error('not-used-by-read-only-projection'); } },
    readiness: async () => ({ authentication: true, authority: true, provider: true, evidence: true }),
    directAdmin: {
      publicOrigin: panelOrigin,
      createGateway(owners) {
        const gateway = createDirectAdminGateway(auth.bridge, owners);
        return async request => {
          hostedObservations.push({ method: request.method, path: new URL(request.url).pathname });
          return gateway(request);
        };
      },
    },
  };
  host = await createWorkforceServer({ storagePath: dbPath, dependencies: hostDeps });
  const hostAddress = await listen(host.server, '127.0.0.1');
  const workforceOrigin = `http://127.0.0.1:${hostAddress.port}`;
  const pnpmRoot = join(repo, 'node_modules/.pnpm');
  const playwrightDir = (await (await import('node:fs/promises')).readdir(pnpmRoot))
    .find(name => name.startsWith('playwright@') && existsSync(join(pnpmRoot, name, 'node_modules/playwright/index.mjs')));
  assert.ok(playwrightDir, 'locked Playwright package is installed');
  const { chromium } = await import(pathToFileURL(join(pnpmRoot, playwrightDir, 'node_modules/playwright/index.mjs')).href);
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? '/usr/bin/chromium', args: ['--ignore-certificate-errors'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  await context.addCookies([{ name: '__Host-titan-da-session', value: auth.token, url: panelOrigin, secure: true, httpOnly: true, sameSite: 'Strict' }]);
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(safeError(error)));
  await page.goto(panelOrigin);
  await page.getByText('Hosted Workforce is unavailable. Reconnect to retrieve current state.', { exact: true }).waitFor();
  assert.equal(relayObservations.length, 1, `real relay received the initial context request; panel=${JSON.stringify(panelObservations)} page=${JSON.stringify(pageErrors)}`);
  assert.equal(relayObservations[0].status, 503, 'the extracted relay production default fails closed without configuration');
  assert.equal(relayObservations[0].code, 'cookie_boundary_unverified',
    'the current production loader reports the unverified-cookie boundary explicitly');
  assert.equal(hostedObservations.length, 0, 'missing relay config refuses before calling the hosted owner');
  assert.equal(await page.getByRole('navigation').count(), 0, 'missing config exposes no company views');
  assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).count(), 0, 'missing config exposes no controls');

  // Only the extracted module's in-process test harness receives this fixture.
  // No environment variable, config file, or production RAW executable enables forwarding.
  relayFixtureConfig = Object.freeze({ publicOrigin: panelOrigin, publicHost: new URL(panelOrigin).host,
    upstreamOrigin: workforceOrigin, upstreamUrl: new URL(workforceOrigin) });
  await page.getByRole('button', { name: 'Reconnect / refresh' }).click();
  try { await page.getByText('Current hosted projection', { exact: true }).waitFor(); }
  catch {
    throw new Error(`latest owner integration unavailable; panel=${JSON.stringify(panelObservations)} relay=${JSON.stringify(relayObservations)} hosted=${JSON.stringify(hostedObservations)} page=${JSON.stringify(pageErrors)} ui=${JSON.stringify(await page.locator('#titan-workforce').innerText())}`);
  }
  await page.getByText('company-a', { exact: true }).waitFor();
  await page.getByText('fixture-company-a-worker', { exact: true }).waitFor();
  assert.ok(hostedObservations.some(entry => entry.path === '/v1/directadmin/context'));
  assert.ok(hostedObservations.some(entry => entry.path === '/v1/directadmin/titan_workforce/projection'));
  await page.getByRole('button', { name: 'Work', exact: true }).click();
  await page.getByText('fixture-company-a-work', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Evidence', exact: true }).click();
  await page.getByText('fixture-company-a-work', { exact: true }).click();
  await page.getByText('fixture-evidence-company-a', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  await page.getByText('This is a read-only Workforce projection. The canonical owner has not exposed an authorized lifecycle control; no request was sent.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).count(), 0, 'canonical controls=[] keeps the UI read-only');
  assert.deepEqual(pageErrors, [], 'packaged role has no browser runtime errors');

  // A valid-length CSRF mismatch is a session-rejected response and clears
  // that browser context's HttpOnly cookie. Keep it in an isolated context so
  // the main operator session can continue through intent/company/expiry checks.
  const csrfContext = await browser.newContext({ ignoreHTTPSErrors: true });
  let wrongCsrf;
  try {
    await csrfContext.addCookies([{ name: '__Host-titan-da-session', value: auth.token, url: panelOrigin,
      secure: true, httpOnly: true, sameSite: 'Strict' }]);
    const csrfPage = await csrfContext.newPage();
    await csrfPage.goto(panelOrigin);
    await csrfPage.getByText('Current hosted projection', { exact: true }).waitFor();
    wrongCsrf = await csrfPage.evaluate(async () => {
      const relay = await import('/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs');
      const fetcher = relay.createDirectAdminRelayFetch();
      const response = await fetcher('/v1/directadmin/context', { method: 'GET', headers: { Accept: 'application/json', 'X-Titan-CSRF': 'Z'.repeat(43) } });
      return { status: response.status, body: await response.json() };
    });
    assert.equal(wrongCsrf.status, 401, 'a well-formed but incorrect CSRF token is denied by the canonical bridge');
    assert.equal(wrongCsrf.body.read_only, true);
    assert.ok(!JSON.stringify(wrongCsrf.body).includes(auth.token), 'denial response does not contain the session credential');
    assert.equal((await csrfContext.cookies(panelOrigin)).some(cookie => cookie.name === '__Host-titan-da-session'), false,
      'the invalid-CSRF session-rejected response clears its isolated HttpOnly cookie');
  } finally { await csrfContext.close(); }
  assert.ok(relayObservations.some(entry => entry.status === 401 && entry.code === 'directadmin-session-rejected'),
    'the real RAW route preserves canonical invalid-session denial');

  const beforeWork = await (async () => {
    const db = createSqliteStorage(dbPath);
    try { return (await db.query('SELECT payload FROM workforce_work_items WHERE company_id=$1 AND work_id=$2', ['company-a', 'fixture-company-a-work'])).rows[0].payload; }
    finally { await db.close(); }
  })();
  const beforeEvents = await (async () => {
    const db = createSqliteStorage(dbPath);
    try { return (await db.query('SELECT COUNT(*) AS total FROM workforce_events')).rows[0].total; }
    finally { await db.close(); }
  })();
  const denial = await page.evaluate(async sdkDataUrl => {
    const [SDK, relay] = await Promise.all([import(sdkDataUrl), import('/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs')]);
    const session = new SDK.DirectAdminCockpitSession(() => document.querySelector('meta[name="titan-directadmin-csrf"]')?.getAttribute('content') ?? '', relay.createDirectAdminRelayFetch());
    try {
      const context = await session.connect();
      try {
        const receipt = await session.intent('titan_workforce', { company_id: context.company_id, actor_id: context.actor_id,
          capability_id: 'work.pause', operation_id: 'fixture-operation-denied', correlation_id: 'fixture-correlation-denied',
          input: { action: 'pause', work_id: 'fixture-company-a-work', reason: 'test-only denied proposal' } });
        return { accepted: true, receipt: Boolean(receipt) };
      } catch (error) { return { accepted: false, error: String(error?.message ?? '') }; }
    } finally { session.dispose(); }
  }, `data:text/javascript;base64,${Buffer.from(await readFile(join(browserPackage, 'images/sdk.mjs'))).toString('base64')}`);
  assert.equal(denial.accepted, false, 'canonical context reaches the unsupported action owner and is denied');
  assert.equal(denial.error, 'directadmin-http-403', 'the current #1049 gateway maps the typed #811 unsupported-action denial');
  assert.equal((await context.cookies(panelOrigin)).some(cookie => cookie.name === '__Host-titan-da-session' && cookie.value === auth.token), true,
    'typed governed-intent 403 leaves the still-valid DirectAdmin session cookie intact');
  assert.equal(hostedObservations.some(entry => entry.path === '/v1/directadmin/titan_workforce/intents'), true,
    'the canonical revision assertion passes through #812 to the host owner');
  assert.ok(!denial.error.includes('fixture-operation-denied'), 'the UI receives no intent/owner detail');
  const directHeaders = {
    host: new URL(panelOrigin).host,
    origin: panelOrigin,
    referer: `${panelOrigin}/`,
    'sec-fetch-site': 'same-origin',
    'x-titan-csrf': bridgeFixture.csrf,
    cookie: `__Host-titan-da-session=${auth.token}`,
    accept: 'application/json',
  };
  const hostedContextResponse = await nodeHttpFetch(`${workforceOrigin}/v1/directadmin/context`, { headers: directHeaders });
  assert.equal(hostedContextResponse.status, 200, `separate diagnostic reaches the same #811/#1049 host: ${JSON.stringify(await hostedContextResponse.clone().json())}`);
  const hostedContext = await hostedContextResponse.json();
  const hostedDenialResponse = await nodeHttpFetch(`${workforceOrigin}/v1/directadmin/titan_workforce/intents`, {
    method: 'POST', headers: { ...directHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({ company_id: hostedContext.company_id, actor_id: hostedContext.actor_id,
      context_revision: hostedContext.context_revision, capability_id: 'work.pause', operation_id: 'fixture-operation-denied',
      correlation_id: 'fixture-correlation-denied', input: { action: 'pause', work_id: 'fixture-company-a-work', reason: 'test-only denied proposal' } }),
  });
  assert.equal(hostedDenialResponse.status, 403, 'the current #1049 gateway safely maps the #811 typed lifecycle denial');
  assert.deepEqual(await hostedDenialResponse.json(), { error: 'directadmin-workforce-action-unsupported', read_only: true });
  assert.ok(hostedObservations.some(entry => entry.path === '/v1/directadmin/titan_workforce/intents'),
    'diagnostic confirmed #811 receives and refuses the canonical context when reached');
  const afterDb = createSqliteStorage(dbPath);
  try {
    assert.equal((await afterDb.query('SELECT payload FROM workforce_work_items WHERE company_id=$1 AND work_id=$2', ['company-a', 'fixture-company-a-work'])).rows[0].payload, beforeWork);
    assert.equal((await afterDb.query('SELECT COUNT(*) AS total FROM workforce_events')).rows[0].total, beforeEvents, 'denied intent changed no workforce rows/events');
  } finally { await afterDb.close(); }

  const companySwitch = await page.evaluate(async sdkDataUrl => {
    const [SDK, relay] = await Promise.all([import(sdkDataUrl), import('/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs')]);
    const session = new SDK.DirectAdminCockpitSession(() => document.querySelector('meta[name="titan-directadmin-csrf"]')?.getAttribute('content') ?? '', relay.createDirectAdminRelayFetch());
    try { await session.connect(); await session.switchCompany('company-b'); return (await session.connect()).company_id; }
    finally { session.dispose(); }
  }, `data:text/javascript;base64,${Buffer.from(await readFile(join(browserPackage, 'images/sdk.mjs'))).toString('base64')}`);
  assert.equal(companySwitch, 'company-b', 'canonical session bridge switches the current company through the RAW route');
  await page.getByText('Context changed. Reconnect to load permitted Workforce.', { exact: true }).waitFor();
  assert.equal(await page.getByText('fixture-company-a-worker', { exact: true }).count(), 0, 'other tab erases company A before refresh');
  await page.getByRole('button', { name: 'Reconnect / refresh' }).click();
  await page.getByText('company-b', { exact: true }).waitFor();
  await page.getByText('Current hosted projection', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Roster', exact: true }).click();
  await page.getByText('fixture-company-b-worker', { exact: true }).waitFor();
  assert.equal(await page.getByText('fixture-company-a-worker', { exact: true }).count(), 0, 'company B projection has no company A worker');

  auth.setClock(auth.now + 301_000);
  await page.getByRole('button', { name: 'Reconnect / refresh' }).click();
  await page.waitForTimeout(500);
  const expiryState = await page.locator('#titan-workforce').innerText();
  const expiryTail = relayObservations.slice(-3).map(({ status, code, route }) => ({ status, code, route }));
  console.log(`PASS upstream expiry handled and company-b projection cleared; relay status=${expiryTail.at(-1)?.status}`);
  assert.match(expiryState, /Access or company context changed|Hosted Workforce is unavailable|Context changed\. Reconnect to load permitted Workforce/,
    `expired context enters a handled failure state; relay tail=${JSON.stringify(expiryTail)}`);
  assert.equal(await page.getByText('fixture-company-b-worker', { exact: true }).count(), 0, 'expired upstream session clears current projection');
  assert.deepEqual(pageErrors, [], 'security denial and expiry remain handled states');

  console.log('PASS extracted Workforce 0.1.5 + Server Node 0.3.0 relay module + current #811 hosted source; production default denied, fixture config-loader injected in-process only; no CGI config or Apache proof');
  console.log(`PASS scenarios: production default unavailable (HTTP 503 ${relayObservations[0].code}), read-only company-a projection/evidence, empty controls, CSRF denial (${wrongCsrf.status}), hosted governed-action denial without DB/event effects (${denial.error}), company switch to company-b, upstream expiry and client data clearing; relay requests=${relayObservations.length}, hosted routes=${hostedObservations.length}`);
} finally {
  await browser?.close().catch(() => {});
  await host?.close().catch(() => {});
  if (panel) { panel.closeAllConnections(); await new Promise(resolve => panel.close(resolve)).catch(() => {}); }
  for (const close of cleanup) await Promise.resolve(close()).catch(() => {});
  for (const close of lifecycleCallbacks) await Promise.resolve(close()).catch(() => {});
  await rm(scratch, { recursive: true, force: true });
}
