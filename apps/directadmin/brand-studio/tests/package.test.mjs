import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { buildPackage, inspectPackageTar, packageFiles } from '../tools/package.mjs';

const fixtureSdk = 'export class DirectAdminCockpitSession {} export function mountDirectAdminProjection() {} export const validateDirectAdminPluginPackage = () => ({valid:true}); export const assertPluginCanBeInstalled = () => true;\n';
const pluginRoot = fileURLToPath(new URL('../', import.meta.url));
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'brand-studio-package-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceDir = join(root, 'source with spaces');
  for (const file of packageFiles) {
    await mkdir(dirname(join(sourceDir, file)), { recursive: true });
    if (file.startsWith('scripts/') || ['lib/entry.mjs', 'images/cockpit.mjs', 'images/style.css'].includes(file)) await copyFile(join(pluginRoot, file), join(sourceDir, file));
    else if (file === 'plugin.conf') await writeFile(join(sourceDir, file), 'name=Titan Web\nauthor=Titan Zero\nversion=0.1.0\nactive=yes\n');
    else await writeFile(join(sourceDir, file), `Fixture only: ${file}\n`);
  }
  const sdkModulePath = join(root, 'compiled-sdk.mjs');
  await writeFile(sdkModulePath, fixtureSdk);
  return { root, sourceDir, sdkModulePath, outputDir: join(root, 'dist') };
}

test('package is deterministic, allowlisted, executable, SDK-bound and checksummed', async (t) => {
  const input = await fixture(t);
  await writeFile(join(input.sourceDir, '.env'), 'SECRET=excluded');
  const first = await buildPackage(input), firstBytes = await readFile(first.archivePath);
  const second = await buildPackage(input);
  assert.equal(first.sha256, second.sha256);
  assert.deepEqual(firstBytes, await readFile(second.archivePath));
  assert.equal(await readFile(`${first.archivePath}.sha256`, 'utf8'), `${first.sha256}  titan_web.tar.gz\n`);
  const entries = inspectPackageTar(firstBytes);
  assert.deepEqual(entries.map(entry => entry.path), packageFiles);
  assert.equal(entries.find(entry => entry.path === 'images/sdk.mjs').bytes.toString(), fixtureSdk);
  assert.equal(entries.find(entry => entry.path === 'user/index.html').mode, 0o755);
  assert.equal(entries.find(entry => entry.path === 'scripts/install.sh').mode, 0o755);
  if (process.platform !== 'win32') {
    const stage = join(input.root, 'verify'); await mkdir(stage);
    for (const entry of entries) { const path = join(stage, entry.path); await mkdir(dirname(path), { recursive: true }); await writeFile(path, entry.bytes); await chmod(path, entry.mode); }
    assert.match(execFileSync('sh', [join(stage, 'scripts/install.sh')], { encoding: 'utf8' }), /preflight passed/);
    await chmod(join(stage, 'user/index.html'), 0o644);
    assert.throws(() => execFileSync('sh', [join(stage, 'scripts/install.sh')], { stdio: 'pipe' }), /must be executable/);
  }
  const staged = join(input.root, 'entrypoint');
  for (const entry of entries) { const path = join(staged, entry.path); await mkdir(dirname(path), { recursive: true }); await writeFile(path, entry.bytes); }
  const { renderEntry } = await import(`${pathToFileURL(join(staged, 'lib/entry.mjs')).href}?test=${Date.now()}`);
  const html = renderEntry('admin');
  assert.match(html, /data:text\/javascript;base64,/);
  assert.match(html, /"titan-sdk":"data:text\/javascript;base64,/);
  assert.throws(() => renderEntry('root'), /unsupported DirectAdmin role/);
});

test('requires the canonical SDK and rejects missing files and symlinks', async (t) => {
  const input = await fixture(t);
  await assert.rejects(buildPackage({ ...input, sdkModulePath: undefined }), /canonical Cockpit SDK/);
  await rm(join(input.sourceDir, 'images/style.css'));
  await assert.rejects(buildPackage(input), /ENOENT/);
  await writeFile(join(input.sourceDir, 'images/style.css'), 'fixture');
  try {
    await symlink(input.sdkModulePath, join(input.sourceDir, 'unsafe-link'));
    await assert.rejects(buildPackage(input), /Symlinks are forbidden/);
    await rm(join(input.sourceDir, 'unsafe-link'));
  } catch (error) { if (error.code !== 'EPERM') throw error; }
  const badSdk = join(input.root, 'bad-sdk.mjs'); await writeFile(badSdk, 'export const legacy = true;');
  await assert.rejects(buildPackage({ ...input, sdkModulePath: badSdk }), /canonical browser session/);
});

