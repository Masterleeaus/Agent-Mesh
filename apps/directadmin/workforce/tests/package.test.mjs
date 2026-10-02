import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { buildPackage, packageFiles } from '../tools/package.mjs';

const fixtureSdk = 'export const fixtureOnly = true; export class DirectAdminCockpitSession {} export const validateDirectAdminPluginPackage = () => ({valid:true}); export const assertPluginCanBeInstalled = () => true;\n';
const pluginRoot = fileURLToPath(new URL('../', import.meta.url));
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'workforce-package-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceDir = join(root, 'source with spaces');
  for (const file of packageFiles) {
    await mkdir(dirname(join(sourceDir, file)), { recursive: true });
    if (file.startsWith('scripts/')) await copyFile(join(pluginRoot, file), join(sourceDir, file));
    else if (file === 'plugin.conf') await writeFile(join(sourceDir, file), 'name=Titan Workforce\nauthor=Titan Zero\nversion=0.1.2\nactive=yes\n');
    else await writeFile(join(sourceDir, file), `Fixture only: ${file}\n`);
  }
  const sdkModulePath = join(root, 'compiled-sdk.mjs');
  await writeFile(sdkModulePath, fixtureSdk);
  return { root, sourceDir, sdkModulePath, outputDir: join(root, 'dist') };
}

test('package is deterministic, flat, allowlisted, executable and checksummed', async (t) => {
  const input = await fixture(t);
  await writeFile(join(input.sourceDir, '.env'), 'SECRET=excluded');
  await mkdir(join(input.sourceDir, 'tests'));
  await writeFile(join(input.sourceDir, 'tests', 'not-shipped.mjs'), 'fixture');
  const first = await buildPackage(input);
  const firstBytes = await readFile(first.archivePath);
  const second = await buildPackage(input);
  assert.equal(first.sha256, second.sha256);
  assert.deepEqual(firstBytes, await readFile(second.archivePath));
  assert.equal(await readFile(`${first.archivePath}.sha256`, 'utf8'), `${first.sha256}  titan_workforce.tar.gz\n`);
  assert.deepEqual(execFileSync('tar', ['-tzf', first.archivePath], { encoding: 'utf8' }).trim().split('\n'), packageFiles);
  const stage = join(input.root, 'arbitrary staging path');
  await mkdir(stage);
  execFileSync('tar', ['--same-permissions', '-xzf', first.archivePath, '-C', stage]);
  assert.match(execFileSync('sh', [join(stage, 'scripts/update.sh')], { cwd: '/', encoding: 'utf8' }), /preflight passed/);
  assert.equal(await readFile(join(stage, 'images/sdk.mjs'), 'utf8'), fixtureSdk);
  await chmod(join(stage, 'user/index.html'), 0o644);
  assert.throws(() => execFileSync('sh', [join(stage, 'scripts/install.sh')], { stdio: 'pipe' }), /must be executable/);
});

test('missing SDK, missing assets and symlinks fail before publication', async (t) => {
  const input = await fixture(t);
  await assert.rejects(buildPackage({ ...input, sdkModulePath: undefined }), /canonical Cockpit SDK/);
  await rm(join(input.sourceDir, 'images/controller.mjs'));
  await assert.rejects(buildPackage(input), /ENOENT/);
  await writeFile(join(input.sourceDir, 'images/controller.mjs'), 'fixture');
  await symlink(input.sdkModulePath, join(input.sourceDir, 'unsafe-link'));
  await assert.rejects(buildPackage(input), /Symlinks are forbidden/);
  await rm(join(input.sourceDir, 'unsafe-link'));
  const sdkLink = join(input.root, 'sdk-link.mjs');
  await symlink(input.sdkModulePath, sdkLink);
  await assert.rejects(buildPackage({ ...input, sdkModulePath: sdkLink }), /regular file/);
});

test('preflight denies missing assets and unsupported Node versions', async (t) => {
  const input = await fixture(t);
  const built = await buildPackage(input);
  const stage = join(input.root, 'staging');
  await mkdir(stage);
  execFileSync('tar', ['--same-permissions', '-xzf', built.archivePath, '-C', stage]);
  await rm(join(stage, 'images/sdk.mjs'));
  assert.throws(() => execFileSync('sh', [join(stage, 'scripts/install.sh')], { stdio: 'pipe' }), /missing or unsafe images\/sdk.mjs/);
  const bin = join(input.root, 'bin');
  await mkdir(bin);
  await writeFile(join(bin, 'node'), '#!/bin/sh\necho "Titan Workforce requires Node.js 22 or newer." >&2\nexit 1\n', { mode: 0o755 });
  assert.throws(() => execFileSync('sh', [join(stage, 'scripts/install.sh')], { env: { ...process.env, PATH: `${bin}:${process.env.PATH}` }, stdio: 'pipe' }), /requires Node.js 22/);
  await rm(join(stage, 'images'), { recursive: true });
  await symlink(join(input.sourceDir, 'images'), join(stage, 'images'));
  assert.throws(() => execFileSync('sh', [join(stage, 'scripts/install.sh')], { stdio: 'pipe' }), /unsafe directory images/);
});

test('uninstall preserves business state and does not invoke host management', async (t) => {
  const input = await fixture(t);
  const businessFile = join(input.root, 'company.sqlite');
  await writeFile(businessFile, 'canonical business state');
  assert.match(execFileSync('sh', [join(input.sourceDir, 'scripts/uninstall.sh')], { cwd: input.root, encoding: 'utf8' }), /preserved/);
  assert.equal(await readFile(businessFile, 'utf8'), 'canonical business state');
  const scripts = await Promise.all(['install', 'update', 'uninstall'].map(name => readFile(join(pluginRoot, `scripts/${name}.sh`), 'utf8')));
  for (const script of scripts) assert.doesNotMatch(script, /\b(sudo|systemctl|service|sqlite3|mysql|curl|wget|rm)\b/);
});
test('legacy SDK without the real browser session cannot be packaged', async t => {
  const input = await fixture(t);
  const legacy = join(input.root, 'legacy-sdk.mjs');
  await writeFile(legacy, 'export const fixtureOnly = true;');
  await assert.rejects(buildPackage({ ...input, sdkModulePath: legacy }), /canonical browser session/);
});
