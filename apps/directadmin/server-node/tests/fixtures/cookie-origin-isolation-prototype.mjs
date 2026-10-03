import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import https from 'node:https';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const scratch = await mkdtemp(join(tmpdir(), 'titan812-cookie-origin-'));
const keyPath = join(scratch, 'fixture.key');
const certPath = join(scratch, 'fixture.crt');
const syntheticCookie = '__Host-titan-da-session=fixture_only.synthetic_token; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=300';
const cookieName = '__Host-titan-da-session';
const records = { panel: [], sameHostOtherPort: [], marketing: [] };
let acceptedMarketingRequests = 0;
let browser;
const servers = [];

function listen(server, preferredPort) {
  servers.push(server);
  return new Promise((resolve, reject) => {
    let fallback = false;
    const onError = error => {
      if (!fallback && preferredPort !== 0 && error.code === 'EADDRINUSE') {
        fallback = true;
        server.listen(0, '127.0.0.1');
        return;
      }
      reject(error);
    };
    server.on('error', onError);
    server.listen(preferredPort, '127.0.0.1', () => {
      server.removeListener('error', onError);
      resolve(server.address().port);
    });
  });
}

function recordRequest(target, request) {
  const cookieFields = [];
  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    if (request.rawHeaders[index].toLowerCase() === 'cookie') cookieFields.push(request.rawHeaders[index + 1]);
  }
  const value = { host: request.headers.host, cookieFields, cookie: request.headers.cookie ?? null };
  records[target].push(value);
  return value;
}

function json(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store', ...extraHeaders });
  response.end(JSON.stringify(payload));
}

try {
  const generated = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyPath,
    '-out', certPath, '-subj', '/CN=panel.titan.test', '-days', '1', '-addext',
    'subjectAltName=DNS:panel.titan.test,DNS:marketing.titan.test'], { stdio: 'ignore' });
  assert.equal(generated.status, 0, 'created disposable localhost TLS certificate');
  const tls = { key: await readFile(keyPath), cert: await readFile(certPath) };

  const panel = https.createServer(tls, (request, response) => {
    const observed = recordRequest('panel', request);
    if (request.url === '/set') return json(response, 200, { ok: true }, { 'set-cookie': syntheticCookie });
    if (request.url === '/set-invalid-domain') {
      return json(response, 200, { ok: true }, {
        'set-cookie': `${cookieName}=poisoned.invalid; Domain=titan.test; Path=/; Secure; HttpOnly; SameSite=Strict`,
      });
    }
    json(response, 200, observed);
  });
  const sameHostOtherPort = https.createServer(tls, (request, response) => {
    const observed = recordRequest('sameHostOtherPort', request);
    json(response, 200, observed);
  });
  const marketing = https.createServer(tls, (request, response) => {
    const observed = recordRequest('marketing', request);
    const invalidHost = request.headers.host !== marketingHost;
    const duplicateCookie = observed.cookieFields.length > 1;
    const titanCookie = observed.cookieFields.some(field => field.split(';').some(pair => pair.trim().startsWith(`${cookieName}=`)));
    if (invalidHost || duplicateCookie || titanCookie) {
      return json(response, 400, { accepted: false, reason: invalidHost ? 'host-mismatch' : duplicateCookie ? 'duplicate-cookie-field' : 'titan-cookie-on-marketing-host' });
    }
    if (request.url !== '/observe') return json(response, 404, { accepted: false, reason: 'no-protected-route' });
    acceptedMarketingRequests += 1;
    json(response, 200, { accepted: true, cookie: observed.cookie });
  });

  const panelPort = await listen(panel, 2222);
  const sameHostPort = await listen(sameHostOtherPort, 8443);
  const marketingPort = await listen(marketing, 8444);
  const panelHost = `panel.titan.test:${panelPort}`;
  const marketingHost = `marketing.titan.test:${marketingPort}`;
  const panelOrigin = `https://panel.titan.test:${panelPort}`;
  const marketingOrigin = `https://marketing.titan.test:${marketingPort}`;

  browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: [
    '--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server',
    '--host-resolver-rules=MAP panel.titan.test 127.0.0.1,MAP marketing.titan.test 127.0.0.1',
  ] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await page.goto(`${panelOrigin}/set`);
  assert.equal(await page.evaluate(() => document.cookie), '', 'HttpOnly session is hidden from JavaScript');
  let cookies = await context.cookies(panelOrigin);
  assert.equal(cookies.find(cookie => cookie.name === cookieName)?.value, 'fixture_only.synthetic_token');

  await page.goto(`${panelOrigin}/set-invalid-domain`);
  cookies = await context.cookies(panelOrigin);
  assert.equal(cookies.find(cookie => cookie.name === cookieName)?.value, 'fixture_only.synthetic_token',
    '__Host cookie with Domain is rejected and cannot overwrite the host-only cookie');

  await page.goto(`https://panel.titan.test:${sameHostPort}/observe`);
  const crossPort = records.sameHostOtherPort.at(-1);
  assert.equal(crossPort.host, `panel.titan.test:${sameHostPort}`);
  assert.equal(crossPort.cookieFields.length, 1);
  assert.equal(crossPort.cookieFields[0], `${cookieName}=fixture_only.synthetic_token`,
    'browser sends the Secure host-only cookie to the same hostname on another port');

  await page.goto(`${marketingOrigin}/observe`);
  const marketingBrowserRequest = records.marketing.at(-1);
  assert.equal(marketingBrowserRequest.host, marketingHost);
  assert.equal(marketingBrowserRequest.cookieFields.length, 0,
    'browser does not send the host-only DirectAdmin cookie to the separate marketing hostname');
  assert.equal(acceptedMarketingRequests, 1, 'separate-host ordinary browser request passes the fixture gate');

  async function rawDuplicateCookieRequest(cookieFields, host = marketingHost) {
    return new Promise((resolve, reject) => {
      const request = https.request({ hostname: '127.0.0.1', port: marketingPort, path: '/attack', method: 'GET',
        rejectUnauthorized: false, headers: ['Host', host, ...cookieFields.flatMap(value => ['Cookie', value])] }, response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(Buffer.from(chunk)));
        response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }));
      });
      request.once('error', reject);
      request.end();
    });
  }

  const beforeDenials = acceptedMarketingRequests;
  const firstOrder = await rawDuplicateCookieRequest(['tracking=fixture', `${cookieName}=attacker.synthetic`]);
  const reverseOrder = await rawDuplicateCookieRequest([`${cookieName}=attacker.synthetic`, 'tracking=fixture']);
  const combinedField = await rawDuplicateCookieRequest([`tracking=fixture; ${cookieName}=attacker.synthetic`]);
  const wrongHost = await rawDuplicateCookieRequest(['tracking=fixture'], `attacker.titan.test:${marketingPort}`);
  for (const denial of [firstOrder, reverseOrder, combinedField]) {
    assert.equal(denial.status, 400, 'Titan session material is rejected before marketing handler');
    assert.equal(denial.body.accepted, false);
  }
  assert.equal(firstOrder.body.reason, 'duplicate-cookie-field');
  assert.equal(reverseOrder.body.reason, 'duplicate-cookie-field');
  assert.equal(combinedField.body.reason, 'titan-cookie-on-marketing-host');
  assert.equal(wrongHost.status, 400);
  assert.equal(wrongHost.body.reason, 'host-mismatch');
  assert.equal(acceptedMarketingRequests, beforeDenials,
    'duplicate fields in either order, a combined Titan cookie, and Host mismatch do not reach the protected handler');

  console.log(JSON.stringify({
    result: 'PASS',
    fixture: 'Chromium 151 + disposable HTTPS servers on 127.0.0.1; all credentials are synthetic',
    panelOrigin,
    panelHost,
    sameHostnameDifferentPort: { cookieSent: true, host: crossPort.host },
    separateHostname: { cookieSent: false, host: marketingBrowserRequest.host },
    invalidHostCookieDomainRejected: true,
    duplicateCookieOrders: ['unrelated-then-titan', 'titan-then-unrelated'].map((order, index) => ({ order, status: [firstOrder, reverseOrder][index].status, reason: [firstOrder, reverseOrder][index].body.reason })),
    combinedTitanCookie: { status: combinedField.status, reason: combinedField.body.reason },
    wrongHost: { status: wrongHost.status, reason: wrongHost.body.reason },
    deniedRequestsReachedProtectedHandler: acceptedMarketingRequests - beforeDenials,
  }, null, 2));
  await context.close();
} finally {
  await browser?.close().catch(() => {});
  for (const server of servers) {
    server.closeAllConnections?.();
    await new Promise(resolve => server.close(resolve)).catch(() => {});
  }
  await rm(scratch, { recursive: true, force: true });
}
