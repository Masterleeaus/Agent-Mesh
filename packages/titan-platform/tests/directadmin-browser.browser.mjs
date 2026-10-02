import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:https';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { fixture, csrf } from './fixtures/directadmin-bridge-fixture.mjs';
import { createDirectAdminGateway } from '../.test-dist/directadmin-plugin.js';

// Explicit browser suite. Ephemeral loopback TLS material is deleted after the
// test; no system trust store, user server, production key or setting is changed.
test('Chromium: real consumers, cookie flags, browser CSRF headers, safe rendering and cross-tab company invalidation', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'titan-da-browser-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const key = join(directory, 'key.pem'), cert = join(directory, 'cert.pem');
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert,
    '-days', '1', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'], { stdio: 'ignore' });
  const observed = [];
  let origin, gateway;
  const entry = `import { DirectAdminCockpitSession } from '/packages/titan-platform/src/directadmin-plugin.js';
    import { mountZeroCore } from '/apps/directadmin/zero-core/cockpit.mjs';
    import { mountOperationsHub } from '/apps/directadmin/operations-hub/cockpit.mjs';
    import { mountBrandStudio } from '/apps/directadmin/brand-studio/cockpit.mjs';
    window.session = new DirectAdminCockpitSession(() => ${JSON.stringify(csrf)});
    await window.session.connect();
    window.mounts = [mountZeroCore(window.session, document.querySelector('#zero')),
      mountOperationsHub(window.session, document.querySelector('#ops')),
      mountBrandStudio(window.session, document.querySelector('#brand'))];
    await Promise.all(window.mounts.map(m => m.refresh())); window.ready = true;`;
  const server = createServer({ key: await readFile(key), cert: await readFile(cert) }, async (incoming, outgoing) => {
    const path = new URL(incoming.url, origin).pathname;
    const send = (contentType, body, status = 200) => {
      outgoing.writeHead(status, { 'content-type': contentType, 'cache-control': 'no-store',
        'content-security-policy': "default-src 'self'; frame-ancestors 'self'; base-uri 'none'" }); outgoing.end(body);
    };
    try {
      if (path.startsWith('/v1/')) {
        const headers = incoming.headers; observed.push({ path, method: incoming.method, headers });
        const chunks = []; for await (const chunk of incoming) chunks.push(chunk);
        const response = await gateway(new Request(`${origin}${incoming.url}`, { method: incoming.method, headers,
          ...(incoming.method === 'POST' ? { body: Buffer.concat(chunks) } : {}) }));
        outgoing.writeHead(response.status, Object.fromEntries(response.headers)); outgoing.end(await response.text()); return;
      }
      if (path === '/test/cockpit') return send('text/html',
        '<!doctype html><title>SDK browser fixture</title><section id="zero"></section><section id="ops"></section><section id="brand"></section><script type="module" src="/test/bootstrap.js"></script>');
      if (path === '/test/bootstrap.js') return send('text/javascript', entry);
      const platform = /^\/packages\/titan-platform\/src\/([a-z-]+\.js)$/.exec(path);
      const consumer = /^\/apps\/directadmin\/(zero-core|operations-hub|brand-studio)\/cockpit\.mjs$/.exec(path);
      if (platform) return send('text/javascript', await readFile(new URL(`../.test-dist/${platform[1]}`, import.meta.url), 'utf8'));
      if (consumer) return send('text/javascript', await readFile(new URL(`../../../apps/directadmin/${consumer[1]}/cockpit.mjs`, import.meta.url), 'utf8'));
      return send('text/plain', 'fixture route not found', 404);
    } catch { return send('text/plain', 'fixture unavailable', 500); }
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  origin = `https://127.0.0.1:${server.address().port}`;
  const f = await fixture(t, { origin }); gateway = createDirectAdminGateway(f.bridge, f.owners);
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  // This trust exception is confined to the disposable context/self-signed fixture.
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  await context.addCookies([{ name: '__Host-titan-da-session', value: f.token, url: origin,
    httpOnly: true, secure: true, sameSite: 'Strict' }]);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/test/cockpit`);
  try { await page.waitForFunction(() => window.ready, undefined, { timeout: 10_000 }); }
  catch { throw new Error(`Browser bootstrap failed: ${errors.join('; ')}; gateway requests: ${observed.map(r => r.path).join(', ')}`); }
  assert.equal(await page.locator('[data-state="ready"]').count(), 3);
  assert.match(await page.locator('#zero [role="status"]').innerText(), /0 attention items/);
  assert.match(await page.locator('#ops [role="status"]').innerText(), /0 observed nodes/);
  assert.match(await page.locator('#brand [role="status"]').innerText(), /Publication publication-1/);
  assert.equal(await page.evaluate(() => document.cookie.includes('__Host-titan-da-session')), false);
  const get = observed.find(r => r.path === '/v1/directadmin/context');
  assert.equal(get.headers['sec-fetch-site'], 'same-origin'); assert.equal(get.headers['x-titan-csrf'], csrf);
  assert.equal(new URL(get.headers.referer).origin, origin);

  // Real keyboard refresh uses the shared button and keeps a live status region.
  await page.locator('#zero button').focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#zero').dataset.state === 'ready');
  assert.equal(await page.locator('#zero [role="status"]').getAttribute('aria-live'), 'polite');

  const original = f.owners.projection;
  f.owners.projection = async (plugin, current) => {
    const result = await original(plugin, current);
    if (plugin === 'titan_web') return { ...result, source: '<img src=x onerror="window.injected=true">',
      data: { ...result.data, publication_id: '<script>window.injected=true</script>' } };
    return result;
  };
  await page.locator('#brand button').click();
  await page.waitForFunction(() => document.querySelector('#brand pre').textContent.includes('<img'));
  assert.equal(await page.locator('#brand img, #brand script').count(), 0);
  assert.equal(await page.evaluate(() => window.injected), undefined);

  // A version mismatch is visible and isolated, without displaying old data.
  f.owners.projection = async (plugin, current) => {
    const result = await original(plugin, current);
    return plugin === 'titan_operations' ? { ...result, data: { ...result.data, schema: 'titan.operations-health.v999' } } : result;
  };
  await page.locator('#ops button').click();
  await page.waitForFunction(() => document.querySelector('#ops').dataset.state === 'incompatible');
  assert.equal(await page.locator('#ops pre').innerText(), '');
  assert.equal(await page.locator('#zero').getAttribute('data-state'), 'ready');
  f.owners.projection = original;

  const sibling = await context.newPage(); await sibling.goto(`${origin}/test/cockpit`); await sibling.waitForFunction(() => window.ready);
  await page.evaluate(() => window.session.switchCompany('company-b'));
  await sibling.waitForFunction(() => [...document.querySelectorAll('section')].every(e => e.dataset.state === 'read-only'));
  assert.equal(await page.locator('section pre').allTextContents().then(text => text.join('')), '');
  assert.equal(await sibling.locator('section pre').allTextContents().then(text => text.join('')), '');
  const post = observed.find(r => r.path === '/v1/directadmin/company');
  assert.equal(post.headers.origin, origin); assert.equal(post.headers['x-titan-csrf'], csrf);
  assert.equal((await context.cookies()).some(c => c.name === '__Host-titan-da-session'), false);
  assert.deepEqual(errors, []);
});
