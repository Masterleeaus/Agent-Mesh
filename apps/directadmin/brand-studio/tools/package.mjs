#!/usr/bin/env node
import { copyFile, lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';

export const packageFiles = Object.freeze([
  'AGENTS.md', 'README.md', 'plugin.conf',
  'admin/index.html', 'reseller/index.html', 'user/index.html',
  'hooks/admin_txt.html', 'hooks/reseller_txt.html', 'hooks/user_txt.html',
  'scripts/install.sh', 'scripts/update.sh', 'scripts/uninstall.sh',
  'lib/entry.mjs', 'images/cockpit.mjs', 'images/sdk.mjs', 'images/style.css',
].sort());
const executable = (file) => /^(admin|reseller|user)\/index\.html$/.test(file) || file.startsWith('scripts/');

function writeOctal(header, offset, length, value) {
  const field = `${Math.max(0, value).toString(8).padStart(length - 1, '0')}\0`;
  if (field.length > length) throw new Error('tar-field-overflow');
  header.write(field, offset, length, 'ascii');
}

export function createPackageTar(files) {
  const chunks = [];
  for (const { path, bytes, mode } of files) {
    if (!path || path.length > 100 || path.startsWith('/') || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('tar-path-invalid');
    const content = Buffer.from(bytes), header = Buffer.alloc(512);
    header.write(path, 0, 100, 'utf8'); writeOctal(header, 100, 8, mode); writeOctal(header, 108, 8, 0); writeOctal(header, 116, 8, 0);
    writeOctal(header, 124, 12, content.length); writeOctal(header, 136, 12, 0); header.fill(0x20, 148, 156); header[156] = 0x30;
    header.write('ustar\0', 257, 6, 'ascii'); header.write('00', 263, 2, 'ascii');
    let checksum = 0; for (const byte of header) checksum += byte;
    header.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148, 8, 'ascii');
    chunks.push(header, content);
    const padding = (512 - content.length % 512) % 512; if (padding) chunks.push(Buffer.alloc(padding));
  }
  chunks.push(Buffer.alloc(1024));
  return Buffer.concat(chunks);
}

export function inspectPackageTar(bytes) {
  const tar = gunzipSync(bytes), entries = []; let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512); if (header.every(byte => byte === 0)) break;
    const path = header.subarray(0, 100).toString('utf8').replace(/\0.*$/s, '');
    const size = Number.parseInt(header.subarray(124, 136).toString('ascii').replace(/\0.*$/s, '').trim() || '0', 8);
    const mode = Number.parseInt(header.subarray(100, 108).toString('ascii').replace(/\0.*$/s, '').trim() || '0', 8);
    if (header.subarray(257, 263).toString('ascii') !== 'ustar\0' || header[156] !== 0x30 || !Number.isSafeInteger(size) || size < 0) throw new Error('tar-entry-invalid');
    const expectedChecksum = Number.parseInt(header.subarray(148, 156).toString('ascii').replace(/\0.*$/s, '').trim(), 8);
    const checksumHeader = Buffer.from(header); checksumHeader.fill(0x20, 148, 156);
    if (!Number.isFinite(expectedChecksum) || [...checksumHeader].reduce((sum, byte) => sum + byte, 0) !== expectedChecksum) throw new Error('tar-checksum-invalid');
    const start = offset + 512, end = start + size; if (end > tar.length) throw new Error('tar-entry-truncated');
    entries.push({ path, mode, bytes: tar.subarray(start, end) }); offset = start + Math.ceil(size / 512) * 512;
  }
  return entries;
}

async function rejectSymlinks(path) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) throw new Error(`Symlinks are forbidden: ${path}`);
  if (stat.isDirectory()) for (const entry of await readdir(path)) await rejectSymlinks(join(path, entry));
}

export async function buildPackage({ sourceDir = resolve(dirname(fileURLToPath(import.meta.url)), '..'), outputDir, sdkModulePath } = {}) {
  if (!sdkModulePath) throw new Error('A compiled canonical Cockpit SDK module is required (--sdk-module).');
  sourceDir = resolve(sourceDir); outputDir = resolve(outputDir ?? join(sourceDir, 'dist')); sdkModulePath = resolve(sdkModulePath);
  await rejectSymlinks(sourceDir);
  if (!(await lstat(sdkModulePath)).isFile()) throw new Error('SDK module must be a regular file, not a symlink.');
  const SDK = await import(pathToFileURL(sdkModulePath).href);
  if (typeof SDK.DirectAdminCockpitSession !== 'function' || typeof SDK.mountDirectAdminProjection !== 'function' ||
      typeof SDK.validateDirectAdminPluginPackage !== 'function' || typeof SDK.assertPluginCanBeInstalled !== 'function') {
    throw new Error('SDK must export the canonical browser session, projection mount and package validators.');
  }
  const temporary = await mkdtemp(join(tmpdir(), 'titan-brand-studio-package-'));
  try {
    const manifest = await readFile(join(sourceDir, 'plugin.conf'), 'utf8');
    const versionMatch = manifest.match(/^version=(\d+\.\d+\.\d+)$/m);
    if (!versionMatch) throw new Error('plugin.conf must declare a semantic version.');
    const version = versionMatch[1], stage = join(temporary, 'stage'), verify = join(temporary, 'verify');
    await mkdir(stage); await mkdir(verify);
    for (const file of packageFiles) {
      const source = file === 'images/sdk.mjs' ? sdkModulePath : join(sourceDir, file);
      if (!(await lstat(source)).isFile()) throw new Error(`Required file is not regular: ${file}`);
      const destination = join(stage, file); await mkdir(dirname(destination), { recursive: true, mode: 0o755 });
      const contents = await readFile(source, 'utf8');
      await writeFile(destination, contents.replace(/\r\n/g, '\n'), { mode: executable(file) ? 0o755 : 0o644 });
      await chmod(destination, executable(file) ? 0o755 : 0o644);
    }
    const tar = createPackageTar(await Promise.all(packageFiles.map(async path => ({ path, bytes: await readFile(join(stage, path)), mode: executable(path) ? 0o755 : 0o644 }))));
    const bytes = gzipSync(tar, { level: 9 }), candidate = join(temporary, 'titan_web.tar.gz'); await writeFile(candidate, bytes);
    const entries = inspectPackageTar(bytes), listing = entries.map(entry => entry.path);
    if (JSON.stringify(listing) !== JSON.stringify(packageFiles)) throw new Error('Archive allowlist mismatch.');
    for (const entry of entries) {
      const file = entry.path;
      if (entry.mode !== (executable(file) ? 0o755 : 0o644)) throw new Error(`Archive mode/type mismatch: ${file}`);
      if (!entry.bytes.equals(await readFile(join(stage, file)))) throw new Error(`Archive content mismatch: ${file}`);
    }
    SDK.assertPluginCanBeInstalled(SDK.validateDirectAdminPluginPackage({
      plugin_id: 'titan_web', version, archive_filename: 'titan_web.tar.gz', manifest_content: await readFile(join(stage, 'plugin.conf'), 'utf8'),
      files: listing, executable_files: listing.filter(executable),
      role_entrypoints: { admin: 'admin/index.html', reseller: 'reseller/index.html', user: 'user/index.html' }, hooks: listing.filter(file => file.startsWith('hooks/')),
    }));
    if (process.platform !== 'win32') execFileSync('sh', [join(stage, 'scripts/install.sh')], { stdio: 'pipe' });
    await mkdir(outputDir, { recursive: true });
    const archivePath = join(outputDir, 'titan_web.tar.gz'), sha256 = createHash('sha256').update(bytes).digest('hex');
    await copyFile(candidate, archivePath); await writeFile(`${archivePath}.sha256`, `${sha256}  titan_web.tar.gz\n`);
    return { archivePath, sha256, files: packageFiles.length };
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = { '--sdk-module': 'sdkModulePath', '--output-dir': 'outputDir', '--source-dir': 'sourceDir' }[process.argv[i]];
    if (!key || !process.argv[i + 1]) throw new Error('Usage: package.mjs --sdk-module <compiled SDK module> [--output-dir <directory>]');
    options[key] = process.argv[i + 1];
  }
  console.log(JSON.stringify(await buildPackage(options)));
}

