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
 discovery:{company_id,controls:globalThis.fixtureControls??[{action:'pause',capability_id:'fixture.pause'},{action:'shell',capability_id:'shell'}],workers:[{company_id,worker_id:'<img src=x onerror=alert(1)>',kind:'digital',role:'worker',active:true,capabilities:['work.pause']}]},
 status:{company_id,work:[{company_id,work_id:'fixture-work',objective:'Fixture job',assignee:'<img src=x onerror=alert(1)>',state:'COMPLETED',evidence_refs:['fixture-evidence']}]}}};}
 async intent(plugin,input){globalThis.fixtureCalls=(globalThis.fixtureCalls||0)+1; if(globalThis.fixtureDenied) throw Error('403 sensitive-error'); return {status:'REQUESTED',correlation_id:input.correlation_id,receipt_id:'fixture-receipt'};}
}`;

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
