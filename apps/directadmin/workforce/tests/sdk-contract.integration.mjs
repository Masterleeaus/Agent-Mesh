import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
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
