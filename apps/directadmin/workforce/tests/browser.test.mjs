import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

// Fixture transport only. No fixture is included in the install archive.
const fixtureSdk = `export class DirectAdminCockpitSession {
 subscribe(listener) {this.listener=listener;} invalidate() {this.listener?.();}
 async connect(){if(globalThis.fixtureWait) await new Promise(resolve=>{globalThis.fixtureRelease=resolve;}); return {company_id:globalThis.fixtureCompany||'fixture-company',actor_id:'fixture-actor',session_revision:1,context_revision:'fixture-context'};}
 async projection(){const company_id=globalThis.fixtureCompany||'fixture-company'; return {company_id,source:'fixture-browser-owner',freshness:'2026-10-02T00:00:00.000Z',evidence_refs:['fixture-projection-evidence'],data:{schema:'titan.workforce-cockpit.v1',company_id,
 discovery:{company_id,controls:globalThis.fixtureControls??[{action:'pause',capability_id:'fixture.pause'},{action:'shell',capability_id:'shell'}],workers:globalThis.fixtureWorkers??[{company_id,worker_id:'<img src=x onerror=alert(1)>',kind:'digital',role:'worker',active:true,capabilities:['work.pause']}]},
 status:{company_id,work:globalThis.fixtureWork??[{company_id,work_id:'fixture-work',objective:'Fixture job',assignee:'<img src=x onerror=alert(1)>',state:'COMPLETED',evidence_refs:['fixture-evidence']}]}}};}
 async intent(plugin,input){globalThis.fixtureCalls=(globalThis.fixtureCalls||0)+1; globalThis.fixtureIntent={plugin,intent:input}; if(globalThis.fixtureDenied) throw Error(globalThis.fixtureDenied===true?'403 sensitive-error':globalThis.fixtureDenied); if(input.input.action==='reassign'){const evidence='fixture-reassignment-evidence';globalThis.fixtureWork=globalThis.fixtureWork.map(item=>item.work_id===input.input.work_id?{...item,assignee:input.input.target_worker_id,evidence_refs:[...(item.evidence_refs||[]),evidence]}:item);} return {status:'REQUESTED',correlation_id:input.correlation_id,receipt_id:input.input.action==='reassign'?'fixture-reassignment-receipt':'fixture-receipt'};}
}`;
const fixtureRelayClient = `export function createDirectAdminRelayFetch(fetchImpl = globalThis.fetch) { return fetchImpl; }`;
async function serveFixtureRelayClient(page) {
  await page.route('https://workforce.test/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs', route =>
    route.fulfill({ contentType: 'text/javascript', body: fixtureRelayClient }));
}

test('executable cockpit renders safely, submits bounded controls, and clears on denial', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'workforce-browser-'));
  let browser;
  try {
    await cp(new URL('../', import.meta.url), folder, { recursive: true });
    await writeFile(join(folder, 'images/sdk.mjs'), fixtureSdk);
    const { renderEntry } = await import(pathToFileURL(join(folder, 'lib/entry.mjs')));
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await serveFixtureRelayClient(page);
    await page.route('https://workforce.test/', route => route.fulfill({ contentType: 'text/html', body: renderEntry('user') }));
    await page.goto('https://workforce.test/');
    await page.getByText('Current hosted projection', { exact: true }).waitFor();
    assert.equal(await page.locator('#titan-workforce img').count(), 0);
    assert.equal(await page.getByRole('button', { name: '<img src=x onerror=alert(1)>' }).count(), 1);
    await page.getByRole('button', { name: 'Work', exact: true }).click();
    await page.getByLabel('Filter work').selectOption('verified');
    assert.equal(await page.getByText('Fixture job', { exact: true }).count(), 0);
    await page.getByLabel('Filter work').selectOption('all');
    assert.equal(await page.getByText('Fixture job', { exact: true }).count(), 1);
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    assert.equal(await page.locator('option[value="shell"]').count(), 0);
    await page.getByLabel('Reason', { exact: true }).fill('Fixture pause request');
    await page.getByRole('button', { name: 'Submit governed request' }).click();
    await page.getByText('Requested', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => globalThis.fixtureCalls), 1);
    await page.evaluate(() => { globalThis.fixtureDenied = true; });
    await page.getByLabel('Reason', { exact: true }).fill('Fixture denied request');
    await page.getByRole('button', { name: 'Submit governed request' }).click();
    await page.getByText('Access or company context changed. Reconnect to revalidate.').waitFor();
    assert.equal(await page.getByText('fixture-company', { exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).count(), 0);
    assert.equal(await page.getByText('sensitive-error').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); await rm(folder, { recursive: true, force: true }); }
});

test('existing cockpit consumes the typed READY reassignment contract and displays the receipt/evidence', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'workforce-reassignment-browser-'));
  let browser;
  try {
    await cp(new URL('../', import.meta.url), folder, { recursive: true });
    await writeFile(join(folder, 'images/sdk.mjs'), fixtureSdk);
    const { renderEntry } = await import(pathToFileURL(join(folder, 'lib/entry.mjs')));
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    const page = await browser.newPage();
    await page.addInitScript(() => {
      globalThis.fixtureControls = [{ action: 'reassign', capability_id: 'titan.workforce.reassign',
        requires_fresh_approval: true, grants_authority: false }];
      globalThis.fixtureWorkers = [
        { company_id: 'fixture-company', worker_id: 'worker-old', kind: 'digital', active: true, capabilities: [] },
        { company_id: 'fixture-company', worker_id: 'worker-target', kind: 'digital', active: true, capabilities: ['work.site.schedule'] },
        { company_id: 'fixture-company', worker_id: 'worker-unqualified', kind: 'human', active: true, capabilities: [] },
        { company_id: 'fixture-company', worker_id: 'worker-inactive', kind: 'human', active: false, capabilities: [] },
      ];
      globalThis.fixtureWork = [
        { company_id: 'fixture-company', work_id: 'ready-work', state: 'READY', assignee: 'worker-old',
          required_capabilities: ['work.site.schedule'], evidence_refs: [], context_refs: [] },
        { company_id: 'fixture-company', work_id: 'active-work', state: 'IN_PROGRESS', assignee: 'worker-old', evidence_refs: [], context_refs: [] },
      ];
    });
    await serveFixtureRelayClient(page);
    await page.route('https://workforce.test/', route => route.fulfill({ contentType: 'text/html', body: renderEntry('user') }));
    await page.goto('https://workforce.test/');
    await page.getByText('Current hosted projection', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await page.getByLabel('Operation').selectOption('reassign');
    const workSelect = page.getByLabel('Work item');
    assert.equal(await workSelect.locator('option[value="ready-work"]').count(), 1);
    assert.equal(await workSelect.locator('option[value="active-work"]').count(), 0);
    await workSelect.selectOption('ready-work');
    const targetSelect = page.getByLabel('Target participant');
    assert.equal(await targetSelect.locator('option[value="worker-old"]').count(), 0);
    assert.equal(await targetSelect.locator('option[value="worker-inactive"]').count(), 0);
    assert.equal(await targetSelect.locator('option[value="worker-unqualified"]').count(), 0);
    assert.equal(await targetSelect.locator('option[value="worker-target"]').count(), 1);
    await targetSelect.selectOption('worker-target');
    await page.getByLabel('Reason', { exact: true }).fill('Balance the ready workload');
    await page.getByRole('button', { name: 'Submit governed request' }).click();
    await page.getByText('Requested', { exact: true }).waitFor();
    const sent = await page.evaluate(() => globalThis.fixtureIntent);
    assert.equal(sent.plugin, 'titan_workforce');
    assert.equal(sent.intent.capability_id, 'titan.workforce.reassign');
    assert.deepEqual(sent.intent.input, {
      action: 'reassign', work_id: 'ready-work', reason: 'Balance the ready workload',
      expected_assignee_id: 'worker-old', target_worker_id: 'worker-target',
    });
    await page.getByRole('button', { name: 'Evidence', exact: true }).click();
    await page.getByText('fixture-reassignment-receipt', { exact: true }).waitFor();
    await page.locator('details > summary').filter({ hasText: 'ready-work' }).click();
    await page.getByText('fixture-reassignment-evidence', { exact: true }).waitFor();
    assert.equal(await page.getByText('Verified outcome with evidence', { exact: true }).count(), 0,
      'the REQUESTED gateway receipt is never promoted to verified outcome');
  } finally { await browser?.close(); await rm(folder, { recursive: true, force: true }); }
});

test('context change and page lifecycle erase the prior company before reconnect settles', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'workforce-lifecycle-'));
  let browser;
  try {
    await cp(new URL('../', import.meta.url), folder, { recursive: true });
    await writeFile(join(folder, 'images/sdk.mjs'), fixtureSdk);
    const { renderEntry } = await import(pathToFileURL(join(folder, 'lib/entry.mjs')));
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await serveFixtureRelayClient(page);
    await page.route('https://workforce.test/', route => route.fulfill({ contentType: 'text/html', body: renderEntry('user') }));
    await page.goto('https://workforce.test/');
    await page.getByText('Current hosted projection', { exact: true }).waitFor();
    await page.evaluate(() => {
      globalThis.fixtureCompany = 'new-company'; globalThis.fixtureWait = true;
      window.dispatchEvent(new Event('titan-context-changed'));
    });
    assert.match(await page.locator('#titan-workforce').innerText(), /Loading current company context/);
    assert.equal(await page.getByText('fixture-company', { exact: true }).count(), 0);
    assert.equal(await page.getByRole('navigation').count(), 0);
    await page.evaluate(() => { globalThis.fixtureWait = false; globalThis.fixtureRelease(); });
    await page.getByText('new-company', { exact: true }).waitFor();
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
    assert.equal(await page.getByText('new-company', { exact: true }).count(), 0);
    assert.equal(await page.getByRole('navigation').count(), 0);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await page.getByText('new-company', { exact: true }).waitFor();
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); await rm(folder, { recursive: true, force: true }); }
});

test('an explicitly empty hosted controls list renders read-only and sends no intent', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'workforce-readonly-browser-'));
  let browser;
  try {
    await cp(new URL('../', import.meta.url), folder, { recursive: true });
    await writeFile(join(folder, 'images/sdk.mjs'), fixtureSdk);
    const { renderEntry } = await import(pathToFileURL(join(folder, 'lib/entry.mjs')));
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    const page = await browser.newPage();
    await serveFixtureRelayClient(page);
    await page.addInitScript(() => { globalThis.fixtureControls = []; });
    await page.route('https://workforce.test/', route => route.fulfill({ contentType: 'text/html', body: renderEntry('user') }));
    await page.goto('https://workforce.test/');
    await page.getByText('Current hosted projection', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await page.getByText('This is a read-only Workforce projection. The canonical owner has not exposed an authorized lifecycle control; no request was sent.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).count(), 0);
    assert.equal(await page.evaluate(() => globalThis.fixtureCalls || 0), 0);
  } finally { await browser?.close(); await rm(folder, { recursive: true, force: true }); }
});

test('missing Server Node relay module renders an explicit unavailable state', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'workforce-no-relay-'));
  let browser;
  try {
    await cp(new URL('../', import.meta.url), folder, { recursive: true });
    await writeFile(join(folder, 'images/sdk.mjs'), fixtureSdk);
    const { renderEntry } = await import(pathToFileURL(join(folder, 'lib/entry.mjs')));
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    const page = await browser.newPage();
    await page.route('https://workforce.test/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs', route =>
      route.fulfill({ status: 404, contentType: 'text/plain', body: 'not installed' }));
    await page.route('https://workforce.test/', route => route.fulfill({ contentType: 'text/html', body: renderEntry('user') }));
    await page.goto('https://workforce.test/');
    await page.getByText('DirectAdmin Workforce relay is unavailable. Install or restore the Titan Server Node plugin, then reconnect.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).count(), 0);
    assert.equal(await page.getByRole('navigation').count(), 0);
  } finally { await browser?.close(); await rm(folder, { recursive: true, force: true }); }
});

test('invalid relay factory result cannot fall back to direct API fetch', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'workforce-invalid-relay-'));
  let browser;
  try {
    await cp(new URL('../', import.meta.url), folder, { recursive: true });
    await writeFile(join(folder, 'images/sdk.mjs'), fixtureSdk);
    const { renderEntry } = await import(pathToFileURL(join(folder, 'lib/entry.mjs')));
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    const page = await browser.newPage();
    const apiRequests = [];
    await page.route('https://workforce.test/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs', route =>
      route.fulfill({ contentType: 'text/javascript', body: 'export function createDirectAdminRelayFetch() { return undefined; }' }));
    await page.route('https://workforce.test/v1/directadmin/**', async route => {
      apiRequests.push(route.request().url());
      await route.fulfill({ status: 500, body: 'unexpected direct request' });
    });
    await page.route('https://workforce.test/', route => route.fulfill({ contentType: 'text/html', body: renderEntry('user') }));
    await page.goto('https://workforce.test/');
    await page.getByText('DirectAdmin Workforce relay is unavailable. Install or restore the Titan Server Node plugin, then reconnect.', { exact: true }).waitFor();
    assert.equal(apiRequests.length, 0);
    assert.equal(await page.getByRole('button', { name: 'Submit governed request' }).count(), 0);
  } finally { await browser?.close(); await rm(folder, { recursive: true, force: true }); }
});
