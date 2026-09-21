#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const zipIndex = args.indexOf('--zip');
const zipPath = zipIndex >= 0 ? args[zipIndex + 1] : null;
let failures = 0;
const summary = [];

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}
function pass(message) {
  summary.push(message);
  console.log(`PASS: ${message}`);
}
function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    ...options
  });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  return result;
}
function walk(dir, predicate = () => true) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, predicate));
    else if (predicate(full)) out.push(full);
  }
  return out;
}
function relative(file) { return path.relative(root, file).replaceAll(path.sep, '/'); }

const MAX_PARALLEL_TESTS = Math.max(2, Math.min(8, Number(process.env.CODEE_VERIFY_JOBS) || 8));
async function runNodeTestsParallel(relativeFiles, label) {
  let next = 0;
  const errors = [];
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= relativeFiles.length) return;
      const file = relativeFiles[index];
      const result = await new Promise(resolve => {
        const child = spawn(process.execPath, [file], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '', stderr = '';
        child.stdout.on('data', chunk => { if (stdout.length < 2 * 1024 * 1024) stdout += chunk; });
        child.stderr.on('data', chunk => { if (stderr.length < 2 * 1024 * 1024) stderr += chunk; });
        child.on('error', error => resolve({ status: 1, stdout, stderr: `${stderr}${error.message}` }));
        child.on('close', code => resolve({ status: code ?? 1, stdout, stderr }));
      });
      if (result.status !== 0) errors.push({ file, ...result });
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL_TESTS, Math.max(1, relativeFiles.length)) }, () => worker()));
  for (const error of errors) {
    if (error.stdout) process.stdout.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    fail(`${label} ${error.file}`);
  }
  if (!errors.length) pass(`${relativeFiles.length}/${relativeFiles.length} ${label}`);
}

// 1) Regression tests: tests/test-*.js
const topTests = fs.readdirSync(path.join(root, 'tests'))
  .filter(name => /^test-.*\.js$/.test(name))
  .sort();
await runNodeTestsParallel(topTests.map(name => path.join('tests', name)), 'top-level regression tests');

// Titan donor suites.
const titanDonorTests = fs.readdirSync(path.join(root, 'tests'))
  .filter(name => /^donor-titan-.*\.test\.js$/.test(name))
  .sort();
await runNodeTestsParallel(titanDonorTests.map(name => path.join('tests', name)), 'Titan donor suites');

// Repository donor suites.
const repoDir = path.join(root, 'tests', 'donor-repository-intelligence');
const repoTests = fs.existsSync(repoDir)
  ? fs.readdirSync(repoDir).filter(name => /\.test\.js$/.test(name)).sort()
  : [];
await runNodeTestsParallel(repoTests.map(name => path.join('tests', 'donor-repository-intelligence', name)), 'donor-repository-intelligence suites');

// Workforce donor suite uses its canonical run-all driver.
const workforceRunner = path.join(root, 'tests', 'donor-workforce', 'run-all.js');
if (fs.existsSync(workforceRunner)) {
  const before = failures;
  const result = run(process.execPath, [path.relative(root, workforceRunner)]);
  if (result.status !== 0) fail('donor-workforce/run-all.js');
  if (failures === before) pass('donor-workforce suite');
}

// 2) JavaScript syntax. Equivalent to `node --check` for every JS file.
const jsFiles = [path.join(root, 'src'), path.join(root, 'tests'), path.join(root, 'tools')]
  .flatMap(dir => fs.existsSync(dir) ? walk(dir, file => file.endsWith('.js') || file.endsWith('.mjs')) : [])
  .sort();
async function runSyntaxChecksParallel(files) {
  let next = 0;
  const errors = [];
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= files.length) return;
      const file = files[index];
      const result = await new Promise(resolve => {
        const child = spawn(process.execPath, ['--check', file], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }); // node --check
        let stdout = '', stderr = '';
        child.stdout.on('data', chunk => { if (stdout.length < 1024 * 1024) stdout += chunk; });
        child.stderr.on('data', chunk => { if (stderr.length < 1024 * 1024) stderr += chunk; });
        child.on('error', error => resolve({ status: 1, stdout, stderr: `${stderr}${error.message}` }));
        child.on('close', code => resolve({ status: code ?? 1, stdout, stderr }));
      });
      if (result.status !== 0) errors.push({ file, ...result });
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL_TESTS, Math.max(1, files.length)) }, () => worker()));
  for (const error of errors) {
    if (error.stdout) process.stdout.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    fail(`syntax ${relative(error.file)}`);
  }
  if (!errors.length) pass(`${files.length}/${files.length} JavaScript syntax checks`);
}
await runSyntaxChecksParallel(jsFiles);

// 3) JSON validation.
const jsonFiles = walk(root, file => file.endsWith('.json'))
  .filter(file => !relative(file).startsWith('node_modules/'))
  .sort();
let jsonFailures = 0;
for (const file of jsonFiles) {
  try { JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { jsonFailures += 1; fail(`JSON ${relative(file)}: ${error.message}`); }
}
if (!jsonFailures) pass(`${jsonFiles.length}/${jsonFiles.length} JSON parses`);

// Source manifest: every packaged source/test/doc/tool file except the manifest itself is hashed.
try {
  const sourceManifestPath = path.join(root, 'source-manifest.json');
  const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
  if (sourceManifest.schema !== 1 || sourceManifest.algorithm !== 'sha256' || !Array.isArray(sourceManifest.files)) throw new Error('invalid source manifest schema');
  const expectedRows = walk(root, () => true)
    .map(file => relative(file))
    .filter(rel => rel !== 'source-manifest.json' && !rel.endsWith('.zip') && !rel.startsWith('.tmp/'))
    .sort();
  const declaredRows = sourceManifest.files.map(row => String(row?.path || '')).sort();
  if (JSON.stringify(expectedRows) !== JSON.stringify(declaredRows)) throw new Error('source manifest path set does not match package files');
  for (const row of sourceManifest.files) {
    const file = path.join(root, row.path);
    const bytes = fs.readFileSync(file);
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    if (Number(row.bytes) !== bytes.length || String(row.sha256 || '').toLowerCase() !== sha256) throw new Error(`source manifest mismatch: ${row.path}`);
  }
  if (Number(sourceManifest.fileCount) !== sourceManifest.files.length) throw new Error('source manifest fileCount mismatch');
  pass(`source-manifest.json ${sourceManifest.files.length} files`);
} catch (error) { fail(`source-manifest.json: ${error.message}`); }

// 4) Manifest v3 and direct references.
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  if (manifest.manifest_version !== 3) fail('manifest.json must be MV3');
  const refs = new Set();
  if (manifest.background?.service_worker) refs.add(manifest.background.service_worker);
  if (manifest.side_panel?.default_path) refs.add(manifest.side_panel.default_path);
  for (const cs of manifest.content_scripts || []) for (const js of cs.js || []) refs.add(js);
  for (const iconSet of [manifest.icons, manifest.action?.default_icon]) {
    if (iconSet) for (const value of Object.values(iconSet)) refs.add(value);
  }
  for (const ref of refs) if (!fs.existsSync(path.join(root, ref))) fail(`manifest reference missing: ${ref}`);
  if (!failures) pass(`manifest.json MV3 and ${refs.size} direct references`);
} catch (error) { fail(`manifest.json: ${error.message}`); }

// 5) service-worker importScripts load order references.
try {
  const workerPath = path.join(root, manifest?.background?.service_worker || 'src/lib/service-worker.js');
  const worker = fs.readFileSync(workerPath, 'utf8');
  const importBlockMatches = [...worker.matchAll(/importScripts\(([^;]+?)\);/gs)];
  const workerDir = path.dirname(workerPath);
  const imports = [];
  for (const match of importBlockMatches) {
    for (const str of match[1].matchAll(/['"]([^'"]+\.js)['"]/g)) imports.push(str[1]);
  }
  const missing = imports.filter(ref => !fs.existsSync(path.resolve(workerDir, ref)));
  if (missing.length) fail(`importScripts missing: ${missing.join(', ')}`);
  else pass(`${imports.length} importScripts references`);
} catch (error) { fail(`importScripts validation: ${error.message}`); }

// 6) Static security guard for the active extension source.
const sourceJs = walk(path.join(root, 'src'), file => file.endsWith('.js'));
const forbidden = [
  [/\beval\s*\(/, 'eval'],
  [/\bnew\s+Function\s*\(/, 'new Function'],
  [/document\.write\s*\(/, 'document.write'],
  [/\.innerHTML\s*=/, 'innerHTML assignment'],
  [/\bfetch\s*\(/, 'direct fetch transport'],
  [/new\s+XMLHttpRequest\b/, 'XMLHttpRequest'],
  [/new\s+WebSocket\b/, 'WebSocket transport']
];
let securityHits = 0;
const APPROVED_NETWORK_TRANSPORT = path.join(root, 'src/lib/approved-network-transport.js');
for (const file of sourceJs) {
  const text = fs.readFileSync(file, 'utf8');
  for (const [regex, label] of forbidden) {
    if (label === 'direct fetch transport' && path.resolve(file) === path.resolve(APPROVED_NETWORK_TRANSPORT)) continue;
    if (regex.test(text)) { securityHits += 1; fail(`${label} in ${relative(file)}`); }
  }
}
try {
  const transportText = fs.readFileSync(APPROVED_NETWORK_TRANSPORT, 'utf8');
  if (!/\bfetch\s*\(/.test(transportText)) throw new Error('approved transport does not implement fetch');
  for (const token of ["redirect:'error'", "credentials:'omit'", 'chrome.permissions.contains', 'MAX_REQUEST_BYTES', 'MAX_RESPONSE_BYTES']) if (!transportText.includes(token)) throw new Error(`approved transport missing guard ${token}`);
  pass('approved network transport is isolated and guarded');
} catch (error) { securityHits += 1; fail(`approved network transport: ${error.message}`); }
if (!securityHits) pass(`active source security sink scan (${sourceJs.length} files)`);

// 7) Optional packaged ZIP integrity.
if (zipPath) {
  const resolved = path.resolve(process.cwd(), zipPath);
  if (!fs.existsSync(resolved)) fail(`ZIP not found: ${resolved}`);
  else {
    const result = run('unzip', ['-t', resolved]); // unzip integrity
    if (result.status !== 0) fail(`unzip integrity: ${resolved}`);
    else pass(`unzip integrity ${path.basename(resolved)}`);
  }
}

if (failures) {
  console.error(`CODEE_FULL_VERIFY: FAIL (${failures} failure${failures === 1 ? '' : 's'})`);
  process.exit(1);
}
console.log(`CODEE_FULL_VERIFY: PASS`);
console.log(`Verified: ${summary.join('; ')}`);
