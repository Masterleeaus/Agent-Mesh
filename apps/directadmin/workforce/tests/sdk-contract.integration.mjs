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
test('published SDK without commissioned CSRF/session fails closed in real executable role routes', async () => {
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
      await page.getByText('Hosted Workforce is unavailable. Reconnect to retrieve current state.').waitFor();
      assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).count(), 0);
      assert.equal(await page.getByText('fixture-company').count(), 0);
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser?.close(); await rm(folder, { recursive: true, force: true }); }
});

test('packaged cockpit handles hosted-route loss, governed cancel, company change, expired-session response and shared logout in a real browser', async () => {
  const { execFileSync } = await import('node:child_process');
  const { chromium } = await import('@playwright/test');
  const folder = await mkdtemp(join(tmpdir(), 'workforce-browser-acceptance-'));
  const csrf = 'A'.repeat(43);
  const cookie = 'titan_test_session=browser-fixture-only';
  const requests = [];
  const acceptedIntents = [];
  let activeCompany = 'company-a';
  let ownerAvailable = false;
  let expireNextIntent = false;
  let loggedOut = false;
  let holdNextContext = false;
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
    response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify(value));
  };
  const readBody = async request => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
  };
  const contextFor = company_id => ({ schema: 'titan.directadmin.session/v1', actor_id: 'browser-fixture-actor', company_id,
    company_ids: [company_id], context_revision: `revision-${company_id}`, session_revision: 7, da_role: 'user',
    expires_at: Date.now() + 15 * 60_000, authority: 'not-carried' });
  const projectionFor = company_id => ({ company_id, source: 'controlled-test-http-owner', freshness: new Date().toISOString(), evidence_refs: [],
    data: { company_id, schema: 'titan.workforce-cockpit.v1',
      discovery: { company_id, workers: [{ company_id, worker_id: `${company_id}-worker`, kind: 'digital', role: 'worker', active: true, capabilities: ['work.cancel'] }],
        controls: [{ action: 'cancel', capability_id: 'test.cancel' }] },
      status: { company_id, observed_at: new Date().toISOString(), runtime_status: 'available',
        work: [{ company_id, work_id: `${company_id}-work`, objective: 'Browser fixture work item', assignee: `${company_id}-worker`, state: 'IN_PROGRESS', evidence_refs: [] }] } } });

  server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      const body = request.method === 'POST' ? await readBody(request) : undefined;
      requests.push({ method: request.method, path: url.pathname, headers: request.headers, body });
      const protectedRequest = ['/v1/directadmin/context', '/v1/directadmin/titan_workforce/projection',
        '/v1/directadmin/titan_workforce/intents', '/v1/directadmin/logout'].includes(url.pathname);
      if (protectedRequest && (request.headers.cookie?.includes(cookie) !== true || request.headers['x-titan-csrf'] !== csrf ||
          (request.method === 'POST' && request.headers.origin !== `http://127.0.0.1:${server.address().port}`))) {
        json(response, 403, { error: 'fixture-request-rejected' }); return;
      }
      if (url.pathname === '/v1/directadmin/context' && request.method === 'GET') {
        if (loggedOut) { json(response, 401, { error: 'session-expired' }); return; }
        if (holdNextContext) {
          holdNextContext = false;
          heldContext.entered.resolve();
          await heldContext.release.promise;
        }
        json(response, 200, contextFor(activeCompany)); return;
      }
      if (url.pathname === '/v1/directadmin/titan_workforce/projection' && request.method === 'GET') {
        if (loggedOut) { json(response, 401, { error: 'session-expired' }); return; }
        if (!ownerAvailable) { json(response, 503, { error: 'owner-not-mounted' }); return; }
        const company_id = activeCompany;
        json(response, 200, { context: contextFor(company_id), projection: projectionFor(company_id) }); return;
      }
      if (url.pathname === '/v1/directadmin/titan_workforce/intents' && request.method === 'POST') {
        if (loggedOut || expireNextIntent) { expireNextIntent = false; json(response, 401, { error: 'session-expired' }); return; }
        if (body?.company_id !== activeCompany || body?.input?.action !== 'cancel' || body?.input?.work_id !== `${activeCompany}-work` ||
            body?.actor_id !== 'browser-fixture-actor' || body?.capability_id !== 'test.cancel' || body?.context_revision !== `revision-${activeCompany}`) {
          json(response, 409, { error: 'fixture-intent-scope-mismatch' }); return;
        }
        acceptedIntents.push(body);
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
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    await page.getByText('Hosted Workforce is unavailable. Reconnect to retrieve current state.').waitFor();
    assert.equal(requests.filter(item => item.path === '/v1/directadmin/titan_workforce/projection').length, 1, 'real shared SDK attempted the same-origin owner route');
    assert.equal(await page.getByRole('navigation').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).count(), 0);
    assert.equal(await page.getByText('company-a', { exact: true }).count(), 0, 'no company is asserted when owner routes are unavailable');

    ownerAvailable = true;
    await page.getByRole('button', { name: 'Reconnect / refresh' }).click();
    await page.getByText('company-a', { exact: true }).waitFor();
    assert.equal(await page.getByText('Current hosted projection', { exact: true }).count(), 1);
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await page.getByLabel('Operation').selectOption('cancel');
    await page.getByLabel('Work item').selectOption('company-a-work');
    await page.getByLabel('Reason', { exact: true }).fill('Browser cancellation acceptance fixture');
    pendingIntent = { entered: deferred(), release: deferred() };
    await page.locator('form button[type="submit"]').evaluate(button => { button.click(); button.click(); });
    await Promise.race([pendingIntent.entered.promise, new Promise((_, reject) => setTimeout(() => reject(new Error('browser intent route was not reached')), 3000))]);
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

    const helper = await context.newPage();
    await helper.goto(`${origin}/logout-helper`);
    await helper.waitForFunction(() => typeof window.logoutSharedSession === 'function');
    await helper.evaluate(() => window.logoutSharedSession());
    await page.getByText('Context changed. Reconnect to load permitted Workforce.').waitFor();
    assert.equal(await page.getByText('company-b', { exact: true }).count(), 0, 'shared logout invalidation clears company data');
    assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).count(), 0);
    assert.equal(requests.some(item => item.method === 'POST' && item.path === '/v1/directadmin/logout'), true, 'logout uses the shared SDK route');
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
