import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

// Fixture transport only. No fixture is included in the install archive.
const fixtureSdk = `export function createDirectAdminWorkforceClient() {
 const company_id='fixture-company';
 return {context:async()=>({company_id,actor_id:'fixture-actor',session_revision:'1'}),
 discover:async()=>({company_id,controls:['pause','resume','shell'],workers:[{company_id,worker_id:'<img src=x onerror=alert(1)>',kind:'digital',role:'worker',active:true,capabilities:['work.pause']}]}),
 status:async()=>({company_id,work:[{company_id,work_id:'fixture-work',objective:'Fixture job',assignee:'<img src=x onerror=alert(1)>',state:'COMPLETED',evidence_refs:['fixture-evidence']}]}),
 control:async(ctx,action)=>{globalThis.fixtureCalls=(globalThis.fixtureCalls||0)+1; if(globalThis.fixtureDenied) throw Error('403 sensitive-error'); return {company_id,state:'VERIFIED',operation_id:'fixture-op'};}};
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
    await page.setContent(renderEntry('user'));
    await page.getByText('Current hosted projection', { exact: true }).waitFor();
    assert.equal(await page.locator('#titan-workforce img').count(), 0);
    assert.equal(await page.getByRole('button', { name: '<img src=x onerror=alert(1)>' }).count(), 1);
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    assert.equal(await page.locator('option[value="shell"]').count(), 0);
    await page.getByLabel('Reason', { exact: true }).fill('Fixture pause request');
    await page.getByRole('button', { name: 'Submit governed request' }).click();
    await page.getByText('Verification unproven — evidence or observed verification missing').waitFor();
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
