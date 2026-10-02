import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import { buildPackage, packageFiles } from '../tools/package.mjs';
import { workforceContribution } from '../images/presentation.mjs';

// Explicit published canonical SDK build, not an emulated identity or transport.
assert.ok(process.env.TITAN_COCKPIT_SDK_MODULE, 'TITAN_COCKPIT_SDK_MODULE must reference the compiled canonical SDK');
const sdkPath = resolve(process.env.TITAN_COCKPIT_SDK_MODULE);
const SDK = await import(pathToFileURL(sdkPath));
test('real package satisfies the canonical shared SDK archive contract', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'workforce-sdk-integration-'));
  try {
    const result = await buildPackage({ outputDir, sdkModulePath: sdkPath });
    const manifest = await readFile(new URL('../plugin.conf', import.meta.url), 'utf8');
    const version = manifest.match(/^version=(\d+\.\d+\.\d+)$/m)?.[1];
    assert.ok(version, 'plugin manifest declares a semantic version');
    const validation = SDK.validateDirectAdminPluginPackage({
      plugin_id: 'titan_workforce', version, archive_filename: 'titan_workforce.tar.gz', manifest_content: manifest,
      files: packageFiles, executable_files: packageFiles.filter(file => /^(admin|reseller|user)\//.test(file) || file.startsWith('scripts/')),
      role_entrypoints: { admin: 'admin/index.html', reseller: 'reseller/index.html', user: 'user/index.html' },
      hooks: ['hooks/admin_txt.html', 'hooks/reseller_txt.html', 'hooks/user_txt.html'],
    });
    assert.equal(validation.valid, true, JSON.stringify(validation.errors));
    assert.equal(SDK.assertPluginCanBeInstalled(validation), true);
    assert.ok(result.sha256.length === 64);
  } finally { await rm(outputDir, { recursive: true, force: true }); }
});
test('canonical SDK accepts authority-neutral Workforce contribution for all roles', () => {
  for (const role of ['admin', 'reseller', 'user']) {
    const registry = new SDK.DirectAdminContributionRegistry();
    registry.register(workforceContribution({ phase: 'denied' }, role));
    assert.equal(registry.snapshot().contributions.length, 1);
    assert.deepEqual(registry.snapshot().degraded_plugins, {});
    assert.deepEqual(registry.snapshot().contributions[0].widgets[0].permitted_actions, []);
  }
});
test('executable role ignores hostile CGI input and fails closed without the Server Node relay', async () => {
  const { execFileSync } = await import('node:child_process');
  const { chromium } = await import('@playwright/test');
  const folder = await mkdtemp(join(tmpdir(), 'workforce-real-sdk-route-'));
  let browser;
  try {
    const result = await buildPackage({ outputDir: folder, sdkModulePath: sdkPath });
    execFileSync('tar', ['-xzf', result.archivePath, '-C', folder]);
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    for (const role of ['admin', 'reseller', 'user']) {
      const hostilePost = 'company_id=attacker-company&csrf=attacker-token&action=cancel';
      const html = execFileSync(join(folder, role, 'index.html'), [], {
        encoding: 'utf8', input: hostilePost,
        // DirectAdmin's documented pipe_post=yes convention passes POST=stdin=true
        // and the parsed form body on stdin to the executable role route.
        env: { ...process.env, POST: 'stdin=true', REQUEST_METHOD: 'POST', QUERY_STRING: 'pipe_post=yes', CONTENT_TYPE: 'application/x-www-form-urlencoded', CONTENT_LENGTH: String(Buffer.byteLength(hostilePost)), TITAN_COMPANY_ID: 'env-company', TITAN_DIRECTADMIN_CSRF: 'env-token', HTTP_COOKIE: 'session=attacker-session' },
      });
      assert.doesNotMatch(html, /attacker-company|attacker-token|query-company|env-company|env-token|attacker-session/);
      const page = await browser.newPage();
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.setContent(html);
      await page.getByText('DirectAdmin Workforce relay is unavailable. Install or restore the Titan Server Node plugin, then reconnect.', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).count(), 0);
      assert.equal(await page.getByText('fixture-company').count(), 0);
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser?.close(); await rm(folder, { recursive: true, force: true }); }
});

test('packaged cockpit handles owner loss, governed cancel, context expiry and receipt invalidation in a real browser', async () => {
  const { execFileSync } = await import('node:child_process');
  const { chromium } = await import('@playwright/test');
  const folder = await mkdtemp(join(tmpdir(), 'workforce-browser-acceptance-'));
  const csrf = 'A'.repeat(43);
  const cookie = 'titan_test_session=browser-fixture-only';
  // This lightweight browser fixture only lets consumer lifecycle tests keep
  // their existing same-origin host. The separate relay integration harness
  // loads #812's exact helper/RAW package and the #811 optional gateway.
  const fixtureRelayClient = 'export function createDirectAdminRelayFetch(fetchImpl = globalThis.fetch) { return async (input, init) => { globalThis.__workforceRelayCalls = (globalThis.__workforceRelayCalls || 0) + 1; return fetchImpl(input, init); }; }';
  const requests = [];
  const acceptedIntents = [];
  let activeCompany = 'company-a';
  let contextLifetimeMs = 15 * 60_000;
  let ownerAvailable = false;
  let expireNextIntent = false;
  let denyNextIntent = false;
  let denyProjectionAfterAcceptedIntent = false;
  let denyNextProjection = false;
  let loggedOut = false;
  let unauthorizedResponses = 0;
  let holdNextContext = false;
  let controlCapabilitiesAvailable = true;
  let shortContextExpiresAt = null;
  let heldContext;
  let pendingIntent;
  let browser;
  let server;
  const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
  };
  const json = (response, status, value) => {
    if (response.destroyed || response.writableEnded) return;
    response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify(value));
  };
  const readBody = async request => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
  };
  const contextFor = company_id => {
    const expires_at = Date.now() + contextLifetimeMs;
    if (contextLifetimeMs < 15 * 60_000) shortContextExpiresAt = expires_at;
    return { schema: 'titan.directadmin.session/v1', actor_id: 'browser-fixture-actor', company_id,
      company_ids: [company_id], context_revision: `revision-${company_id}`, session_revision: 7, da_role: 'user',
      expires_at, authority: 'not-carried' };
  };
  const projectionFor = company_id => ({ company_id, source: 'controlled-test-http-owner', freshness: new Date().toISOString(), evidence_refs: [],
    data: { company_id, schema: 'titan.workforce-cockpit.v1',
      discovery: { company_id, workers: [{ company_id, worker_id: `${company_id}-worker`, kind: 'digital', active: true, capabilities: ['work.cancel'] }],
        controls: controlCapabilitiesAvailable ? [{ action: 'cancel', capability_id: 'test.cancel' }] : [] },
      status: { company_id,
        work: [{ company_id, work_id: `${company_id}-work`, assignee: `${company_id}-worker`, state: 'IN_PROGRESS', context_refs: [], evidence_refs: [] }] } } });

  server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      const body = request.method === 'POST' ? await readBody(request) : undefined;
      if (url.pathname === '/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs' && request.method === 'GET') {
        response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' });
        response.end(fixtureRelayClient); return;
      }
      requests.push({ method: request.method, path: url.pathname, headers: request.headers, body });
      const protectedRequest = ['/v1/directadmin/context', '/v1/directadmin/titan_workforce/projection',
        '/v1/directadmin/titan_workforce/intents', '/v1/directadmin/logout'].includes(url.pathname);
      if (protectedRequest && (request.headers.cookie?.includes(cookie) !== true || request.headers['x-titan-csrf'] !== csrf ||
          (request.method === 'POST' && request.headers.origin !== `http://127.0.0.1:${server.address().port}`))) {
        json(response, 403, { error: 'fixture-request-rejected' }); return;
      }
      if (url.pathname === '/v1/directadmin/context' && request.method === 'GET') {
        if (loggedOut) { unauthorizedResponses++; json(response, 401, { error: 'session-expired' }); return; }
        if (holdNextContext) {
          holdNextContext = false;
          heldContext.entered.resolve();
          await heldContext.release.promise;
        }
        json(response, 200, contextFor(activeCompany)); return;
      }
      if (url.pathname === '/v1/directadmin/titan_workforce/projection' && request.method === 'GET') {
        if (loggedOut) { unauthorizedResponses++; json(response, 401, { error: 'session-expired' }); return; }
        if (denyNextProjection) { denyNextProjection = false; json(response, 403, { error: 'fixture-projection-forbidden' }); return; }
        if (!ownerAvailable) { json(response, 503, { error: 'owner-not-mounted' }); return; }
        const company_id = activeCompany;
        json(response, 200, { context: contextFor(company_id), projection: projectionFor(company_id) }); return;
      }
      if (url.pathname === '/v1/directadmin/titan_workforce/intents' && request.method === 'POST') {
        if (loggedOut || expireNextIntent) { unauthorizedResponses++; expireNextIntent = false; json(response, 401, { error: 'session-expired' }); return; }
        const contextRevision = `revision-${activeCompany}`;
        const contextRevisionAssertion = typeof SDK.directAdminContextRevisionAssertion === 'function'
          ? await SDK.directAdminContextRevisionAssertion(contextRevision) : contextRevision;
        if (body?.company_id !== activeCompany || body?.input?.action !== 'cancel' || body?.input?.work_id !== `${activeCompany}-work` ||
            body?.actor_id !== 'browser-fixture-actor' || body?.capability_id !== 'test.cancel' ||
            ![contextRevision, contextRevisionAssertion].includes(body?.context_revision)) {
          json(response, 409, { error: 'fixture-intent-scope-mismatch' }); return;
        }
        if (denyNextIntent) {
          denyNextIntent = false;
          json(response, 403, { error: 'directadmin-workforce-action-unsupported', read_only: true }); return;
        }
        acceptedIntents.push(body);
        if (denyProjectionAfterAcceptedIntent) {
          denyProjectionAfterAcceptedIntent = false;
          denyNextProjection = true;
        }
        if (pendingIntent) {
          pendingIntent.entered.resolve();
          await pendingIntent.release.promise;
        }
        json(response, 202, { status: 'REQUESTED', receipt_id: `browser-fixture-receipt-${acceptedIntents.length}`, correlation_id: body.correlation_id }); return;
      }
      if (url.pathname === '/v1/directadmin/logout' && request.method === 'POST') {
        loggedOut = true;
        json(response, 200, { status: 'reauthentication-required' }); return;
      }
      if (url.pathname === '/' && request.method === 'GET') {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        response.end(commissionedHtml); return;
      }
      if (url.pathname === '/logout-helper' && request.method === 'GET') {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        response.end(logoutHelperHtml); return;
      }
      if (url.pathname === '/away' && request.method === 'GET') {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        response.end('<!doctype html><title>Navigation fixture</title><main>Left the Workforce cockpit.</main>'); return;
      }
      json(response, 404, { error: 'not-found' });
    } catch {
      if (!response.headersSent) json(response, 500, { error: 'fixture-error' });
      else response.destroy();
    }
  });

  let commissionedHtml = '';
  let logoutHelperHtml = '';
  try {
    const result = await buildPackage({ outputDir: folder, sdkModulePath: sdkPath });
    execFileSync('tar', ['-xzf', result.archivePath, '-C', folder]);
    const rendered = execFileSync(join(folder, 'user/index.html'), [], { encoding: 'utf8' });
    commissionedHtml = rendered.replace('<main ', `<meta name="titan-directadmin-csrf" content="${csrf}"><main `);
    const sdk = await readFile(join(folder, 'images/sdk.mjs'), 'utf8');
    const sdkUrl = `data:text/javascript;base64,${Buffer.from(sdk).toString('base64')}`;
    logoutHelperHtml = `<meta name="titan-directadmin-csrf" content="${csrf}"><script type="importmap">${JSON.stringify({ imports: { 'titan-sdk': sdkUrl } })}</script><script type="module">
      import { DirectAdminCockpitSession } from 'titan-sdk';
      window.logoutSharedSession = async () => { const session = new DirectAdminCockpitSession(() => '${csrf}'); await session.connect(); await session.logout(); session.dispose(); };
    </script>`;
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    const context = await browser.newContext();
    await context.addCookies([{ name: 'titan_test_session', value: 'browser-fixture-only', url: origin, sameSite: 'Strict' }]);
    const page = await context.newPage();
    const errors = [];
    const network = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => network.push(`${request.method()} ${request.url()}`));
    page.on('requestfailed', request => network.push(`FAILED ${request.url()} ${request.failure()?.errorText ?? ''}`));
    const submitCancel = async (targetPage, companyId, reason) => {
      await targetPage.getByRole('button', { name: 'Controls', exact: true }).click();
      await targetPage.getByLabel('Operation').selectOption('cancel');
      await targetPage.getByLabel('Work item').selectOption(`${companyId}-work`);
      await targetPage.getByLabel('Reason', { exact: true }).fill(reason);
      const receiptId = `browser-fixture-receipt-${acceptedIntents.length + 1}`;
      await targetPage.getByRole('button', { name: 'Submit governed request' }).click();
      await targetPage.getByText('Requested', { exact: true }).waitFor();
      await targetPage.getByRole('button', { name: 'Evidence', exact: true }).click();
      await targetPage.getByText(receiptId, { exact: true }).waitFor();
      return receiptId;
    };
    await page.goto(origin);
    await page.getByText('Hosted Workforce is unavailable. Reconnect to retrieve current state.').waitFor();
    const bootstrapMeta = await page.evaluate(() => ({ csrfPresent: Boolean(document.querySelector('meta[name="titan-directadmin-csrf"]')?.getAttribute('content')),
      relayCalls: globalThis.__workforceRelayCalls ?? 0, href: location.href }));
    assert.equal(requests.filter(item => item.path === '/v1/directadmin/titan_workforce/projection').length, 1,
      `real shared SDK attempted the same-origin owner route; observed paths=${JSON.stringify(requests.map(item => item.path))}; page errors=${JSON.stringify(errors)}; bootstrap=${JSON.stringify(bootstrapMeta)}; network=${JSON.stringify(network)}`);
    assert.equal(await page.getByRole('navigation').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).count(), 0);
    assert.equal(await page.getByText('company-a', { exact: true }).count(), 0, 'no company is asserted when owner routes are unavailable');

    ownerAvailable = true;
    await page.getByRole('button', { name: 'Reconnect / refresh' }).click();
    await page.getByText('company-a', { exact: true }).waitFor();
    assert.equal(await page.getByText('Current hosted projection', { exact: true }).count(), 1);
    await page.getByRole('button', { name: 'Health', exact: true }).click();
    await page.getByText('controlled-test-http-owner', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await page.getByLabel('Operation').selectOption('cancel');
    await page.getByLabel('Work item').selectOption('company-a-work');
    await page.getByLabel('Reason', { exact: true }).fill('Browser cancellation acceptance fixture');
    pendingIntent = { entered: deferred(), release: deferred() };
    await page.locator('form button[type="submit"]').evaluate(button => { button.click(); button.click(); });
    await Promise.race([pendingIntent.entered.promise, new Promise((_, reject) => setTimeout(async () => reject(new Error(
      `browser intent route was not reached; requests=${JSON.stringify(requests.map(item => ({ method: item.method, path: item.path })))}; page errors=${JSON.stringify(errors)}; browser network=${JSON.stringify(network)}; UI=${JSON.stringify(await page.locator('#titan-workforce').innerText())}`,
    )), 3000))]);
    assert.equal(acceptedIntents.length, 1, 'rapid repeated form activations submit only one hosted intent');
    assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).isDisabled(), true, 'submit control is disabled while the one request is pending');
    assert.equal(acceptedIntents[0].company_id, 'company-a');
    assert.equal(acceptedIntents[0].input.action, 'cancel');
    assert.equal(acceptedIntents[0].input.reason, 'Browser cancellation acceptance fixture');
    assert.match(await page.locator('#titan-workforce').innerText(), /Submitting governed request/);
    pendingIntent.release.resolve();
    await page.getByText('Requested', { exact: true }).waitFor();
    assert.equal(await page.getByText('Verified outcome with evidence', { exact: true }).count(), 0);
    assert.doesNotMatch(await page.locator('#titan-workforce').innerText(), /\bVERIFIED\b|Verified outcome/i,
      'the hosted transport acknowledgement remains REQUESTED and never becomes a verified outcome');
    await page.getByRole('button', { name: 'Evidence', exact: true }).click();
    await page.getByText('browser-fixture-receipt-1', { exact: true }).waitFor();
    assert.equal(await page.getByText('Requested', { exact: true }).count(), 1);
    assert.equal(await page.getByText('Verified outcome with evidence', { exact: true }).count(), 0);
    pendingIntent = null;

    const contextReadsBeforeDenial = requests.filter(item => item.method === 'GET' && item.path === '/v1/directadmin/context').length;
    const projectionReadsBeforeDenial = requests.filter(item => item.method === 'GET' && item.path === '/v1/directadmin/titan_workforce/projection').length;
    denyNextIntent = true;
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await page.getByLabel('Reason', { exact: true }).fill('Unsupported action denial fixture');
    await page.getByRole('button', { name: 'Submit governed request' }).click();
    await page.getByText('The host denied that request. Current company data was refreshed; review it before retrying.', { exact: true }).waitFor();
    assert.equal(acceptedIntents.length, 1, 'unsupported action denial creates no accepted fixture intent');
    assert.equal(await page.getByText('company-a', { exact: true }).count(), 1, 'fresh current company context remains usable after a no-effect 403');
    assert.ok(requests.filter(item => item.method === 'GET' && item.path === '/v1/directadmin/context').length > contextReadsBeforeDenial,
      'the controller revalidates identity after an action denial');
    assert.ok(requests.filter(item => item.method === 'GET' && item.path === '/v1/directadmin/titan_workforce/projection').length > projectionReadsBeforeDenial,
      'the cockpit refreshes canonical projection after an action denial');
    assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).isDisabled(), true,
      'a denied action stays disabled until the operator deliberately refreshes');
    await page.getByRole('button', { name: 'Reconnect / refresh' }).click();
    await page.getByText('Current hosted projection', { exact: true }).waitFor();
    assert.equal(await page.getByText('company-a', { exact: true }).count(), 1);

    activeCompany = 'company-b';
    heldContext = { entered: deferred(), release: deferred() };
    holdNextContext = true;
    await page.evaluate(() => window.dispatchEvent(new Event('titan-context-changed')));
    await Promise.race([heldContext.entered.promise, new Promise((_, reject) => setTimeout(() => reject(new Error('company-switch revalidation was not reached')), 3000))]);
    assert.match(await page.locator('#titan-workforce').innerText(), /Loading current company context/);
    assert.equal(await page.getByText('company-a', { exact: true }).count(), 0, 'prior company data is cleared before new context settles');
    assert.equal(await page.getByRole('navigation').count(), 0);
    heldContext.release.resolve();
    await page.getByText('company-b', { exact: true }).waitFor();
    assert.equal(await page.getByText('company-a-work', { exact: true }).count(), 0);
    assert.equal(await page.getByText('browser-fixture-receipt-1', { exact: true }).count(), 0, 'company change clears the prior receipt');

    const switchReceipt = await submitCancel(page, 'company-b', 'Company switch receipt fixture');
    assert.equal(switchReceipt, 'browser-fixture-receipt-2');
    // The actual packaged pagehide listener must clear the receipt before a BFCache restore reconnects.
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    await page.getByText('Context changed. Reconnect to load permitted Workforce.').waitFor();
    assert.equal(await page.getByText(switchReceipt, { exact: true }).count(), 0, 'pagehide clears a pending-view receipt');
    assert.equal(await page.getByText('company-b', { exact: true }).count(), 0);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await page.getByText('company-b', { exact: true }).waitFor();
    assert.equal(await page.getByText(switchReceipt, { exact: true }).count(), 0, 'BFCache reconnect loads no prior request receipt');

    const reloadReceipt = await submitCancel(page, 'company-b', 'Reload receipt fixture');
    await page.reload();
    await page.getByText('company-b', { exact: true }).waitFor();
    assert.equal(await page.getByText(reloadReceipt, { exact: true }).count(), 0, 'full reload starts with no in-memory receipt');
    await page.getByRole('button', { name: 'Evidence', exact: true }).click();
    await page.getByText('Submit a permitted governed request to inspect its receipt.').waitFor();

    const navigationReceipt = `browser-fixture-receipt-${acceptedIntents.length + 1}`;
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await page.getByLabel('Operation').selectOption('cancel');
    await page.getByLabel('Work item').selectOption('company-b-work');
    await page.getByLabel('Reason', { exact: true }).fill('Canceled navigation receipt fixture');
    pendingIntent = { entered: deferred(), release: deferred() };
    await page.getByRole('button', { name: 'Submit governed request' }).click();
    await Promise.race([pendingIntent.entered.promise, new Promise((_, reject) => setTimeout(() => reject(new Error('navigation intent route was not reached')), 3000))]);
    assert.equal(acceptedIntents.length, 4);
    await page.goto(`${origin}/away`);
    await page.getByText('Left the Workforce cockpit.').waitFor();
    pendingIntent.release.resolve();
    pendingIntent = null;
    await page.goBack();
    await page.getByText('company-b', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Evidence', exact: true }).click();
    await page.getByText('Submit a permitted governed request to inspect its receipt.').waitFor();
    assert.equal(await page.getByText(navigationReceipt, { exact: true }).count(), 0, 'a late acknowledgement cannot restore a receipt after real navigation');

    denyProjectionAfterAcceptedIntent = true;
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await page.getByLabel('Operation').selectOption('cancel');
    await page.getByLabel('Work item').selectOption('company-b-work');
    await page.getByLabel('Reason', { exact: true }).fill('Accepted request with denied read refresh fixture');
    await page.getByRole('button', { name: 'Submit governed request' }).click();
    try {
      await page.getByText('A request was submitted, but current state could not be refreshed. Reconnect and inspect canonical history before retrying.', { exact: true }).waitFor({ timeout: 5000 });
    } catch (error) {
      throw new Error(`${error.message}; UI=${JSON.stringify(await page.locator('#titan-workforce').innerText())}; requests=${JSON.stringify(requests.slice(-8).map(item => ({ method: item.method, path: item.path })))}; accepted=${acceptedIntents.length}; projectionFlag=${denyNextProjection}`);
    }
    assert.equal(acceptedIntents.length, 5, 'the hosted intent was accepted before the projection refresh failed');
    assert.equal(await page.getByText('company-b', { exact: true }).count(), 0, 'denied refresh clears company data');
    assert.doesNotMatch(await page.locator('#titan-workforce').innerText(), /host denied that request/i,
      'a projection 403 after accepted ingress is not reported as an action denial');
    await page.getByRole('button', { name: 'Reconnect / refresh' }).click();
    await page.getByText('company-b', { exact: true }).waitFor();

    const expiryContext = await browser.newContext();
    await expiryContext.addCookies([{ name: 'titan_test_session', value: 'browser-fixture-only', url: origin, sameSite: 'Strict' }]);
    const expiryPage = await expiryContext.newPage();
    await expiryPage.goto(origin);
    await expiryPage.getByText('company-b', { exact: true }).waitFor();
    await expiryPage.getByRole('button', { name: 'Controls', exact: true }).click();
    await expiryPage.getByLabel('Operation').selectOption('cancel');
    await expiryPage.getByLabel('Work item').selectOption('company-b-work');
    await expiryPage.getByLabel('Reason', { exact: true }).fill('Expired authorization acceptance fixture');
    expireNextIntent = true;
    await expiryPage.getByRole('button', { name: 'Submit governed request' }).click();
    await expiryPage.getByText('Context changed. Reconnect to load permitted Workforce.').waitFor();
    assert.equal(await expiryPage.getByText('company-b', { exact: true }).count(), 0);
    assert.equal(await expiryPage.getByRole('button', { name: 'Submit governed request' }).count(), 0);
    assert.equal(await expiryPage.getByText('session-expired', { exact: true }).count(), 0, 'transport diagnostics are not rendered');
    await expiryContext.close();

    const logoutReceipt = await submitCancel(page, 'company-b', 'Logout receipt fixture');
    const helper = await context.newPage();
    await helper.goto(`${origin}/logout-helper`);
    await helper.waitForFunction(() => typeof window.logoutSharedSession === 'function');
    await helper.evaluate(() => window.logoutSharedSession());
    await page.getByText('Context changed. Reconnect to load permitted Workforce.').waitFor();
    assert.equal(await page.getByText('company-b', { exact: true }).count(), 0, 'shared logout invalidation clears company data');
    assert.equal(await page.getByText(logoutReceipt, { exact: true }).count(), 0, 'shared logout invalidation clears the latest receipt');
    assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).count(), 0);
    assert.equal(requests.some(item => item.method === 'POST' && item.path === '/v1/directadmin/logout'), true, 'logout uses the shared SDK route');

    loggedOut = false;
    contextLifetimeMs = 6000;
    const timerContext = await browser.newContext();
    await timerContext.addCookies([{ name: 'titan_test_session', value: 'browser-fixture-only', url: origin, sameSite: 'Strict' }]);
    const timerPage = await timerContext.newPage();
    timerPage.on('pageerror', error => errors.push(error.message));
    await timerPage.goto(origin);
    await timerPage.getByText('company-b', { exact: true }).waitFor();
    await timerPage.getByText('Current hosted projection', { exact: true }).waitFor();
    const timerReceipt = await submitCancel(timerPage, 'company-b', 'Local expiry receipt fixture');
    const localExpiresAt = shortContextExpiresAt;
    const unauthorizedBeforeTimer = unauthorizedResponses;
    assert.ok(Number.isFinite(localExpiresAt));
    await timerPage.getByText('Context changed. Reconnect to load permitted Workforce.', { timeout: 10_000 }).waitFor();
    assert.ok(Date.now() >= localExpiresAt, 'the SDK local expiry timer fires at/after expires_at');
    assert.equal(unauthorizedResponses, unauthorizedBeforeTimer, 'local expiry does not depend on an HTTP 401 response');
    assert.equal(await timerPage.getByText('company-b', { exact: true }).count(), 0, 'the SDK local expires_at timer invalidates the real cockpit session');
    assert.equal(await timerPage.getByText(timerReceipt, { exact: true }).count(), 0, 'local expiry clears a previously visible receipt');
    assert.equal(await timerPage.getByRole('button', { name: 'Submit governed request' }).count(), 0);
    await timerContext.close();

    contextLifetimeMs = 15 * 60_000;
    controlCapabilitiesAvailable = false;
    const readOnlyContext = await browser.newContext();
    await readOnlyContext.addCookies([{ name: 'titan_test_session', value: 'browser-fixture-only', url: origin, sameSite: 'Strict' }]);
    const readOnlyPage = await readOnlyContext.newPage();
    readOnlyPage.on('pageerror', error => errors.push(error.message));
    await readOnlyPage.goto(origin);
    await readOnlyPage.getByText('company-b', { exact: true }).waitFor();
    const intentCountBeforeReadOnlyView = requests.filter(item => item.method === 'POST' && item.path === '/v1/directadmin/titan_workforce/intents').length;
    await readOnlyPage.getByRole('button', { name: 'Controls', exact: true }).click();
    await readOnlyPage.getByText('This is a read-only Workforce projection. The canonical owner has not exposed an authorized lifecycle control; no request was sent.', { exact: true }).waitFor();
    assert.equal(await readOnlyPage.getByRole('button', { name: 'Submit governed request' }).count(), 0);
    assert.equal(requests.filter(item => item.method === 'POST' && item.path === '/v1/directadmin/titan_workforce/intents').length, intentCountBeforeReadOnlyView);
    await readOnlyContext.close();
    for (const item of requests.filter(item => item.path.startsWith('/v1/directadmin/'))) {
      assert.equal(item.headers['x-titan-csrf'], csrf, 'shared SDK supplies its bootstrapped nonce');
      assert.equal(item.headers.cookie?.includes(cookie), true, 'same-origin requests retain the host cookie');
      assert.equal(item.headers['sec-fetch-site'], 'same-origin', 'browser marks requests as same-origin');
      if (item.method === 'POST') assert.equal(item.headers.origin, origin, 'mutations remain same-origin');
    }
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    await browser?.close();
    await new Promise(resolve => server?.close(resolve));
    await rm(folder, { recursive: true, force: true });
  }
});
