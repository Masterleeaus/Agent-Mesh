#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENABLED_PLUGINS, packagePortfolio } from './package-directadmin-portfolio.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_IDS = ['titan-server-node', 'titan_dev_access', 'titan_workforce'];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  return result;
}

function digestFile(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function digestBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function readManifest(pluginRoot) {
  const file = path.join(pluginRoot, 'plugin.conf');
  if (!fs.existsSync(file) || !fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink()) {
    throw new Error('plugin.conf is required at archive root');
  }
  const fields = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean)) {
    const separator = line.indexOf('=');
    if (separator < 1) throw new Error('plugin.conf contains an invalid field');
    fields[line.slice(0, separator)] = line.slice(separator + 1);
  }
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(fields.version ?? '')) {
    throw new Error('plugin.conf must declare a valid package version');
  }
  return fields;
}

function listArchive(archive, plugin) {
  const listing = run('tar', ['--absolute-names', '-tzf', archive]);
  if (listing.status !== 0) throw new Error(`${plugin.id}: archive cannot be listed`);
  const entries = listing.stdout.split(/\r?\n/).filter(Boolean).map((entry) => entry.replace(/^\.\//, ''));
  const details = run('tar', ['--absolute-names', '-tvzf', archive]);
  if (details.status !== 0) throw new Error(`${plugin.id}: archive metadata cannot be read`);
  const detailLines = details.stdout.split(/\r?\n/).filter(Boolean);
  if (entries.length !== detailLines.length) throw new Error(`${plugin.id}: archive entry names are ambiguous`);
  const allowed = plugin.files.map((entry) => entry.replace(/\/$/, ''));
  for (let index = 0; index < entries.length; index += 1) {
    const raw = entries[index];
    const entry = raw.replace(/\/$/, '');
    if (!entry || entry.startsWith('/') || entry.includes('\\') || !/^[A-Za-z0-9._/-]+$/.test(entry)) {
      throw new Error(`unsafe archive path: ${raw}`);
    }
    if (entry.split('/').some((part) => part === '.' || part === '..' || part === '')) {
      throw new Error(`unsafe archive path: ${raw}`);
    }
    const type = detailLines[index][0];
    if (type !== '-' && type !== 'd') throw new Error(`${plugin.id}: archive contains a link or special file: ${raw}`);
  }
  if (!entries.some((entry) => entry.replace(/\/$/, '') === 'plugin.conf')) {
    throw new Error('plugin.conf is required at archive root');
  }
  for (const raw of entries) {
    const entry = raw.replace(/\/$/, '');
    if (!allowed.some((prefix) => entry === prefix || entry.startsWith(`${prefix}/`))) {
      throw new Error(`${plugin.id}: archive contains unexpected path ${raw}`);
    }
  }
  for (const required of plugin.files) {
    const normalized = required.replace(/\/$/, '');
    if (!entries.some((entry) => entry.replace(/\/$/, '') === normalized || entry.replace(/\/$/, '').startsWith(`${normalized}/`))) {
      throw new Error(`${plugin.id}: archive is missing ${required}`);
    }
  }
  const executableFiles = new Set(plugin.executableFiles);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index].replace(/\/$/, '');
    if (executableFiles.has(entry) && !/^-rwxr-xr-x\s/.test(detailLines[index])) {
      throw new Error(`${plugin.id}: executable mode is missing for ${entry}`);
    }
  }
  return entries.map((entry) => entry.replace(/\/$/, '')).filter(Boolean);
}

function treeEntries(directory) {
  const rootStat = fs.lstatSync(directory);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('staging tree root is not a real directory');
  const entries = [];
  function visit(current, relative = '') {
    for (const name of fs.readdirSync(current).sort()) {
      const absolute = path.join(current, name);
      const child = relative ? `${relative}/${name}` : name;
      const stat = fs.lstatSync(absolute);
      const mode = stat.mode & 0o777;
      if (stat.isSymbolicLink()) {
        entries.push({ path: child, type: 'symlink', mode, target: fs.readlinkSync(absolute) });
      } else if (stat.isDirectory()) {
        entries.push({ path: child, type: 'directory', mode });
        visit(absolute, child);
      } else if (stat.isFile()) {
        entries.push({ path: child, type: 'file', mode, sha256: digestFile(absolute) });
      } else {
        entries.push({ path: child, type: 'special', mode });
      }
    }
  }
  visit(directory);
  return entries;
}

function treeDigest(directory) {
  return digestBytes(Buffer.from(JSON.stringify(treeEntries(directory))));
}

function snapshotTree(directory) {
  return JSON.stringify(treeEntries(directory));
}

function snapshotDirectory(directory) {
  if (!fs.existsSync(directory)) return null;
  return snapshotTree(directory);
}

function hasPath(directory) {
  try { fs.lstatSync(directory); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

function assertWritableDirectory(directory) {
  let stat;
  try { stat = fs.lstatSync(directory); }
  catch { throw new Error('filesystem write capability check failed: staging root is missing'); }
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('filesystem write capability check failed: staging root is unsafe');
  try { fs.accessSync(directory, fs.constants.W_OK); }
  catch { throw new Error('insufficient filesystem write capability for staging root'); }
}

function writeJsonAtomically(file, value) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  fs.renameSync(temporary, file);
}

function copyTree(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, preserveTimestamps: true, errorOnExist: true, force: false });
}

function manifestDisplayName(plugin, version) {
  return plugin.legacyDisplayNames?.[version] ?? plugin.displayName;
}

function verifyExtractedTree(directory, plugin) {
  const fields = readManifest(directory);
  if (fields.name !== manifestDisplayName(plugin, fields.version)) {
    throw new Error(`${plugin.id}: plugin.conf display name does not match the package descriptor`);
  }
  const executable = new Set(plugin.executableFiles);
  for (const entry of treeEntries(directory)) {
    if (entry.type === 'symlink' || entry.type === 'special') throw new Error(`${plugin.id}: extracted tree contains an unsafe entry`);
    if (entry.type === 'directory') {
      // Tar may synthesize parent directories not represented in the archive;
      // their mode follows the staging process umask. Require usable owner bits
      // and record exact mode in the rollback fingerprint below.
      if ((entry.mode & 0o700) !== 0o700) throw new Error(`${plugin.id}: staging directory lacks owner access for ${entry.path}`);
    } else {
      const expectedMode = executable.has(entry.path) ? 0o755 : 0o644;
      if (entry.mode !== expectedMode) throw new Error(`${plugin.id}: archive mode mismatch for ${entry.path}`);
    }
  }
  return { fields, entries: treeEntries(directory) };
}

function runLifecycleHook(plugin, tree, name) {
  const file = path.join(tree, 'scripts', `${name}.sh`);
  if (!fs.existsSync(file) || !fs.lstatSync(file).isFile()) throw new Error(`${plugin.id}: missing ${name} lifecycle hook`);
  const args = plugin.id === 'titan-server-node' ? ['--validate-only'] : [];
  const before = snapshotTree(tree);
  const result = run('sh', [file, ...args], { cwd: tree });
  if (result.status !== 0) throw new Error(`${plugin.id}: ${name} validation failed: ${result.stderr || result.stdout}`);
  assert.equal(snapshotTree(tree), before, `${plugin.id} ${name} hook changed staging payload`);
}

class TemporaryDirectAdminManager {
  constructor(root) {
    this.root = root;
    this.plugins = path.join(root, 'plugins');
    this.state = path.join(root, 'state');
    this.rollback = path.join(root, 'rollback');
  }

  prepare() {
    fs.mkdirSync(this.plugins, { recursive: true });
    fs.mkdirSync(this.state, { recursive: true });
    fs.mkdirSync(this.rollback, { recursive: true });
  }

  statePath(id) { return path.join(this.state, `${id}.json`); }
  installedPath(id) { return path.join(this.plugins, id); }
  rollbackPath(id, sha) { return path.join(this.rollback, id, sha); }

  readState(id) {
    const file = this.statePath(id);
    if (!hasPath(file)) return null;
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${id}: manager receipt is not a regular file`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  install(plugin, artifact, lifecycle = 'install') {
    assertWritableDirectory(this.plugins);
    assertWritableDirectory(this.state);
    assertWritableDirectory(this.rollback);
    const archiveSha256 = digestFile(artifact.archive);
    if (archiveSha256 !== artifact.sha256) throw new Error(`${plugin.id}: archive digest does not match its package provenance`);
    const entries = listArchive(artifact.archive, plugin);
    const temp = fs.mkdtempSync(path.join(this.root, `stage-${plugin.id}-`));
    const payload = path.join(temp, 'payload');
    fs.mkdirSync(payload);
    try {
      const extraction = run('tar', ['--no-same-owner', '--same-permissions', '-xzf', artifact.archive, '-C', payload]);
      if (extraction.status !== 0) throw new Error(`${plugin.id}: safe archive extraction failed`);
      const { fields, entries: extracted } = verifyExtractedTree(payload, plugin);
      if (entries.some((entry) => !extracted.some((item) => item.path === entry))) {
        throw new Error(`${plugin.id}: archive entries do not match extracted payload`);
      }
      runLifecycleHook(plugin, payload, lifecycle === 'update' ? 'update' : 'install');
      const destination = this.installedPath(plugin.id);
      const prior = this.readState(plugin.id);
      const exists = hasPath(destination);
      if (exists !== Boolean(prior)) throw new Error(`${plugin.id}: installed payload and manager receipt are inconsistent`);
      if (prior) {
        this.verifyOwnedFiles(plugin, destination, prior);
        if (prior.archive_sha256 === archiveSha256) return { lifecycle: 'unchanged', archiveSha256, version: prior.version, treeSha256: prior.tree_sha256 };
        if (prior.version === fields.version) throw new Error(`${plugin.id}: refusing a different archive with the already-installed version`);
      }
      const treeSha256 = treeDigest(payload);
      const ownedFiles = extracted.map((entry) => {
        const absolute = path.join(payload, entry.path);
        const stat = fs.lstatSync(absolute);
        return stat.isFile() ? { path: entry.path, mode: stat.mode & 0o777, sha256: digestFile(absolute) } : null;
      }).filter(Boolean);
      const nextState = {
        schema: 'titan.directadmin.staging-receipt/v1',
        plugin_id: plugin.id,
        version: fields.version,
        archive_sha256: archiveSha256,
        tree_sha256: treeSha256,
        owned_files: ownedFiles,
        previous: prior ? { version: prior.version, archive_sha256: prior.archive_sha256, tree_sha256: prior.tree_sha256 } : null,
        operation: prior ? 'update' : 'install',
      };
      const backup = prior ? this.rollbackPath(plugin.id, prior.archive_sha256) : null;
      let createdBackup = false;
      if (prior && !fs.existsSync(backup)) {
        copyTree(destination, backup);
        createdBackup = true;
      } else if (prior && treeDigest(backup) !== prior.tree_sha256) {
        throw new Error(`${plugin.id}: rollback evidence does not match the prior installed tree`);
      }
      const displaced = path.join(temp, 'displaced');
      const hadDestination = exists;
      if (hadDestination) fs.renameSync(destination, displaced);
      try {
        fs.renameSync(payload, destination);
        writeJsonAtomically(this.statePath(plugin.id), nextState);
      } catch (error) {
        if (fs.existsSync(destination)) fs.rmSync(destination, { recursive: true, force: true });
        if (hadDestination && fs.existsSync(displaced)) fs.renameSync(displaced, destination);
        if (createdBackup) fs.rmSync(backup, { recursive: true, force: true });
        throw error;
      }
      return { lifecycle: prior ? 'updated' : 'installed', archiveSha256, version: fields.version, treeSha256 };
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }

  verifyOwnedFiles(plugin, directory, state) {
    const rootStat = fs.lstatSync(directory);
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error(`${plugin.id}: installed plugin path is not a real directory`);
    if (treeEntries(directory).some((entry) => entry.type === 'symlink' || entry.type === 'special')) {
      throw new Error(`${plugin.id}: installed plugin tree contains an unsafe filesystem entry`);
    }
    for (const file of state.owned_files) {
      const absolute = path.join(directory, file.path);
      let stat;
      try { stat = fs.lstatSync(absolute); }
      catch { throw new Error(`${plugin.id}: installed package file is missing: ${file.path}`); }
      if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o777) !== file.mode || digestFile(absolute) !== file.sha256) {
        throw new Error(`${plugin.id}: installed package file changed: ${file.path}`);
      }
    }
  }

  rollbackPlugin(plugin) {
    assertWritableDirectory(this.plugins);
    assertWritableDirectory(this.state);
    assertWritableDirectory(this.rollback);
    const current = this.readState(plugin.id);
    if (!current?.previous) throw new Error(`${plugin.id}: no known-good rollback target is recorded`);
    const destination = this.installedPath(plugin.id);
    this.verifyOwnedFiles(plugin, destination, current);
    const baseline = current.previous;
    const backup = this.rollbackPath(plugin.id, baseline.archive_sha256);
    if (!hasPath(backup) || treeDigest(backup) !== baseline.tree_sha256) {
      throw new Error(`${plugin.id}: known-good rollback evidence is missing or corrupt`);
    }
    const temp = fs.mkdtempSync(path.join(this.root, `rollback-${plugin.id}-`));
    const restore = path.join(temp, 'payload');
    copyTree(backup, restore);
    const { fields, entries } = verifyExtractedTree(restore, plugin);
    if (fields.version !== baseline.version || treeDigest(restore) !== baseline.tree_sha256) {
      throw new Error(`${plugin.id}: restored rollback tree failed exact verification`);
    }
    runLifecycleHook(plugin, restore, 'update');
    const currentBackup = this.rollbackPath(plugin.id, current.archive_sha256);
    if (!fs.existsSync(currentBackup)) copyTree(destination, currentBackup);
    const displaced = path.join(temp, 'displaced');
    fs.renameSync(destination, displaced);
    try {
      fs.renameSync(restore, destination);
      const nextState = {
        ...current,
        version: fields.version,
        archive_sha256: baseline.archive_sha256,
        tree_sha256: baseline.tree_sha256,
        owned_files: entries.map((entry) => {
          const absolute = path.join(destination, entry.path);
          const stat = fs.lstatSync(absolute);
          return stat.isFile() ? { path: entry.path, mode: stat.mode & 0o777, sha256: digestFile(absolute) } : null;
        }).filter(Boolean),
        previous: null,
        last_rollback_from_sha256: current.archive_sha256,
      };
      writeJsonAtomically(this.statePath(plugin.id), nextState);
    } catch (error) {
      if (fs.existsSync(destination)) fs.rmSync(destination, { recursive: true, force: true });
      if (fs.existsSync(displaced)) fs.renameSync(displaced, destination);
      throw error;
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
    return { lifecycle: 'restored', fromSha256: current.archive_sha256, toSha256: baseline.archive_sha256, treeSha256: treeDigest(destination) };
  }

  uninstall(plugin) {
    assertWritableDirectory(this.plugins);
    assertWritableDirectory(this.state);
    assertWritableDirectory(this.rollback);
    const state = this.readState(plugin.id);
    const destination = this.installedPath(plugin.id);
    if (!state || !hasPath(destination)) throw new Error(`${plugin.id}: no managed installation to uninstall`);
    this.verifyOwnedFiles(plugin, destination, state);
    runLifecycleHook(plugin, destination, 'uninstall');
    const directories = new Set();
    for (const owned of state.owned_files) {
      const absolute = path.join(destination, owned.path);
      fs.rmSync(absolute);
      let parent = path.dirname(owned.path);
      while (parent !== '.') { directories.add(parent); parent = path.dirname(parent); }
    }
    for (const relative of [...directories].sort((a, b) => b.length - a.length)) {
      const absolute = path.join(destination, relative);
      try { fs.rmdirSync(absolute); } catch (error) { if (!['ENOTEMPTY', 'EEXIST'].includes(error.code)) throw error; }
    }
    try { fs.rmdirSync(destination); } catch (error) { if (!['ENOTEMPTY', 'EEXIST'].includes(error.code)) throw error; }
    fs.rmSync(this.statePath(plugin.id), { force: true });
    fs.rmSync(path.join(this.rollback, plugin.id), { recursive: true, force: true });
    return {
      lifecycle: 'removed',
      packageOwnedFilesRemaining: state.owned_files.filter((file) => fs.existsSync(path.join(destination, file.path))).length,
      managerStateRemaining: fs.existsSync(this.statePath(plugin.id)) || fs.existsSync(path.join(this.rollback, plugin.id)),
    };
  }
}

function bumpPatch(sourceDir, destinationDir) {
  fs.cpSync(sourceDir, destinationDir, { recursive: true, preserveTimestamps: true });
  const manifestPath = path.join(destinationDir, 'plugin.conf');
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  const match = manifest.match(/^version=(\d+)\.(\d+)\.(\d+)$/m);
  if (!match) throw new Error(`cannot stage synthetic update for ${sourceDir}: semantic version missing`);
  const next = `version=${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
  fs.writeFileSync(manifestPath, manifest.replace(match[0], next));
}

function verifyPortfolioBuild(build, plugins) {
  const provenance = JSON.parse(fs.readFileSync(build.provenance, 'utf8'));
  assert.equal(provenance.schema, 'titan.directadmin.portfolio/v1');
  assert.deepEqual(provenance.artifacts.map((artifact) => artifact.plugin_id), PLUGIN_IDS);
  for (const plugin of plugins) {
    const artifact = build.artifacts.find((item) => item.plugin_id === plugin.id);
    const entry = provenance.artifacts.find((item) => item.plugin_id === plugin.id);
    assert.ok(artifact && entry, `${plugin.id} is in generated provenance`);
    assert.equal(artifact.archive_filename, `${plugin.id}.tar.gz`);
    assert.equal(entry.archive_filename, artifact.archive_filename);
    assert.equal(entry.version, artifact.version);
    assert.equal(entry.sha256, digestFile(artifact.archive));
    assert.equal(fs.readFileSync(`${artifact.archive}.sha256`, 'utf8'), `${entry.sha256}  ${artifact.archive_filename}\n`);
  }
  const serverNode = provenance.artifacts.find((artifact) => artifact.plugin_id === 'titan-server-node');
  const workforce = provenance.artifacts.find((artifact) => artifact.plugin_id === 'titan_workforce');
  assert.deepEqual(workforce.dependencies.map(({ plugin_id, sha256 }) => ({ plugin_id, sha256 })), [
    { plugin_id: 'titan-server-node', sha256: serverNode.sha256 },
  ]);
}

function createMalformedArchives(temporaryRoot) {
  const missingRoot = path.join(temporaryRoot, 'missing-root');
  fs.mkdirSync(missingRoot);
  fs.writeFileSync(path.join(missingRoot, 'README.txt'), 'not a DirectAdmin plugin root\n');
  const missingMetadata = path.join(temporaryRoot, 'missing-metadata.tar.gz');
  const missingResult = run('tar', ['-czf', missingMetadata, '-C', missingRoot, 'README.txt']);
  if (missingResult.status !== 0) throw new Error('could not create the missing-metadata test archive');

  const traversalRoot = path.join(temporaryRoot, 'traversal-root');
  fs.mkdirSync(traversalRoot);
  fs.writeFileSync(path.join(traversalRoot, 'safe.txt'), 'must not escape\n');
  const pathTraversal = path.join(temporaryRoot, 'path-traversal.tar.gz');
  const traversalResult = run('tar', [
    '--absolute-names', '--transform=s|safe.txt|../escape-marker.txt|',
    '-czf', pathTraversal, '-C', traversalRoot, 'safe.txt',
  ]);
  if (traversalResult.status !== 0) throw new Error('could not create the path-traversal test archive');
  return { missingMetadata, pathTraversal };
}

function verifyHookPreservesPayload(plugin, extracted) {
  const before = snapshotTree(extracted);
  for (const action of ['install', 'update', 'uninstall']) runLifecycleHook(plugin, extracted, action);
  assert.equal(snapshotTree(extracted), before, `${plugin.id} validation hooks must not alter archived files`);
}

export function runStagingLifecycle() {
  const plugins = ENABLED_PLUGINS.filter((plugin) => PLUGIN_IDS.includes(plugin.id));
  assert.deepEqual(plugins.map((plugin) => plugin.id), PLUGIN_IDS, 'the requested three DirectAdmin packages must be present in portfolio order');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'titan-da-staging-lifecycle-'));
  try {
    const firstDir = path.join(root, 'archives-v1');
    const firstBuild = packagePortfolio({ plugins, outputDir: firstDir });
    verifyPortfolioBuild(firstBuild, plugins);
    const first = firstBuild.artifacts;
    const firstById = new Map(first.map((artifact) => [artifact.plugin_id, artifact]));

    const updatePlugins = plugins.map((plugin) => {
      const source = path.join(root, 'synthetic-update-sources', plugin.id);
      fs.mkdirSync(path.dirname(source), { recursive: true });
      bumpPatch(path.resolve(ROOT, plugin.source), source);
      return { ...plugin, source };
    });
    const secondDir = path.join(root, 'archives-v2-synthetic');
    const secondBuild = packagePortfolio({ plugins: updatePlugins, outputDir: secondDir });
    verifyPortfolioBuild(secondBuild, updatePlugins);
    const second = secondBuild.artifacts;
    const secondById = new Map(second.map((artifact) => [artifact.plugin_id, artifact]));

    const managerRoot = path.join(root, 'temporary-directadmin-manager');
    const manager = new TemporaryDirectAdminManager(managerRoot);
    manager.prepare();
    const sharedSentinel = path.join(manager.plugins, 'unowned-site-state.json');
    fs.writeFileSync(sharedSentinel, '{"preserve":"existing-site"}\n', { mode: 0o640 });
    const sentinelBefore = snapshotTree(manager.plugins);
    const negativeArchives = createMalformedArchives(root);
    const negativeChecks = {};
    const pluginResults = [];

    for (const plugin of plugins) {
      const initial = firstById.get(plugin.id);
      const candidate = secondById.get(plugin.id);
      assert.ok(initial && candidate, `${plugin.id} archives exist`);
      const initialSha = digestFile(initial.archive);
      assert.equal(initialSha, initial.sha256);
      const install = manager.install(plugin, initial, 'install');
      const installedPath = manager.installedPath(plugin.id);
      const initialSnapshot = snapshotTree(installedPath);
      const initialTreeSha = treeDigest(installedPath);
      assert.equal(install.lifecycle, 'installed');
      assert.equal(install.archiveSha256, initialSha);

      const installedAgainBefore = snapshotTree(installedPath);
      const receiptBefore = fs.readFileSync(manager.statePath(plugin.id), 'utf8');
      const reinstall = manager.install(plugin, initial, 'install');
      assert.equal(reinstall.lifecycle, 'unchanged');
      assert.equal(snapshotTree(installedPath), installedAgainBefore, `${plugin.id} same-archive reinstall preserves exact files and modes`);
      assert.equal(fs.readFileSync(manager.statePath(plugin.id), 'utf8'), receiptBefore, `${plugin.id} same-archive reinstall preserves manager receipt`);

      const beforeInvalid = snapshotDirectory(managerRoot);
      let traversalError;
      try { manager.install(plugin, { archive: negativeArchives.pathTraversal, sha256: digestFile(negativeArchives.pathTraversal) }); }
      catch (error) { traversalError = error.message; }
      assert.match(traversalError ?? '', /unsafe archive path/i);
      assert.equal(snapshotDirectory(managerRoot), beforeInvalid, `${plugin.id} unsafe path leaves staging state unchanged`);
      negativeChecks.path_traversal ??= { error: traversalError, state_unchanged: true };

      let metadataError;
      try { manager.install(plugin, { archive: negativeArchives.missingMetadata, sha256: digestFile(negativeArchives.missingMetadata) }); }
      catch (error) { metadataError = error.message; }
      assert.match(metadataError ?? '', /plugin\.conf.*root/i);
      assert.equal(snapshotDirectory(managerRoot), beforeInvalid, `${plugin.id} missing metadata leaves staging state unchanged`);
      negativeChecks.missing_metadata ??= { error: metadataError, state_unchanged: true };

      const update = manager.install(plugin, candidate, 'update');
      const updatedSnapshot = snapshotTree(installedPath);
      const updatedState = manager.readState(plugin.id);
      assert.equal(update.lifecycle, 'updated');
      assert.equal(updatedState.version, candidate.version);
      assert.notEqual(updatedSnapshot, initialSnapshot, `${plugin.id} synthetic version update changes installed package`);
      assert.equal(treeDigest(manager.rollbackPath(plugin.id, initialSha)), initialTreeSha, `${plugin.id} update preserves byte/mode exact known-good rollback tree`);

      const rollback = manager.rollbackPlugin(plugin);
      const restoredSnapshot = snapshotTree(installedPath);
      const restoredState = manager.readState(plugin.id);
      assert.equal(rollback.lifecycle, 'restored');
      assert.equal(restoredSnapshot, initialSnapshot, `${plugin.id} rollback restores exact package contents and modes`);
      assert.equal(restoredState.archive_sha256, initialSha);
      assert.equal(rollback.treeSha256, initialTreeSha);
      const reinstallRestored = manager.install(plugin, initial, 'install');
      assert.equal(reinstallRestored.lifecycle, 'unchanged');
      assert.equal(snapshotTree(installedPath), initialSnapshot);

      const hookPayload = path.join(root, `hooks-${plugin.id}`);
      fs.cpSync(installedPath, hookPayload, { recursive: true, preserveTimestamps: true });
      verifyHookPreservesPayload(plugin, hookPayload);
      fs.rmSync(hookPayload, { recursive: true, force: true });

      pluginResults.push({
        id: plugin.id,
        archive: { filename: path.basename(initial.archive), sha256: initialSha, archive_root_manifest_verified: true, executable_modes_verified: true },
        synthetic_update: { filename: path.basename(candidate.archive), version: candidate.version, sha256: candidate.sha256 },
        lifecycle: { install: install.lifecycle, reinstall: reinstall.lifecycle, update: update.lifecycle, rollback: rollback.lifecycle },
        rollback_evidence: {
          baseline_tree_sha256: initialTreeSha,
          restored_tree_sha256: rollback.treeSha256,
          modes_restored: restoredSnapshot === initialSnapshot,
          retained_known_good_snapshot: fs.existsSync(manager.rollbackPath(plugin.id, initialSha)),
        },
      });
    }

    let privilegeCheck;
    if (typeof process.getuid === 'function' && process.getuid() === 0) {
      privilegeCheck = { verified: false, skipped: 'running as root makes chmod based denial unreliable', state_unchanged: true };
    } else {
      const deniedRoot = path.join(root, 'read-only-staging-manager');
      const deniedPlugins = path.join(deniedRoot, 'plugins');
      fs.mkdirSync(deniedPlugins, { recursive: true, mode: 0o755 });
      const deniedSentinel = path.join(deniedPlugins, 'unowned-site-state.json');
      fs.writeFileSync(deniedSentinel, 'keep\n');
      fs.chmodSync(deniedPlugins, 0o555);
      const deniedManager = new TemporaryDirectAdminManager(deniedRoot);
      const beforeDenied = snapshotDirectory(deniedRoot);
      let deniedError;
      try { deniedManager.install(plugins[0], firstById.get(plugins[0].id), 'install'); }
      catch (error) { deniedError = error.message; }
      assert.match(deniedError ?? '', /filesystem write capability/i);
      assert.equal(snapshotDirectory(deniedRoot), beforeDenied);
      fs.chmodSync(deniedPlugins, 0o755);
      privilegeCheck = { verified: true, error: deniedError, state_unchanged: true };
    }
    negativeChecks.insufficient_filesystem_privilege = privilegeCheck;
    negativeChecks.directadmin_role_privilege_used = false;

    for (const plugin of plugins) {
      const installedPath = manager.installedPath(plugin.id);
      const localUnowned = path.join(installedPath, 'staging-local-unowned-note.txt');
      fs.writeFileSync(localUnowned, 'must survive plugin-owned cleanup\n', { mode: 0o640 });
      const state = manager.readState(plugin.id);
      const ownedBefore = state.owned_files.map((file) => file.path);
      const uninstall = manager.uninstall(plugin);
      assert.equal(uninstall.lifecycle, 'removed');
      assert.equal(uninstall.packageOwnedFilesRemaining, 0);
      assert.equal(uninstall.managerStateRemaining, false);
      assert.equal(fs.readFileSync(localUnowned, 'utf8'), 'must survive plugin-owned cleanup\n');
      pluginResults.find((item) => item.id === plugin.id).lifecycle.uninstall = uninstall.lifecycle;
      pluginResults.find((item) => item.id === plugin.id).cleanup = {
        package_owned_files_remaining: uninstall.packageOwnedFilesRemaining,
        manager_state_remaining: uninstall.managerStateRemaining,
        unowned_sentinel_preserved: fs.readFileSync(sharedSentinel, 'utf8') === '{"preserve":"existing-site"}\n',
        unowned_plugin_note_preserved: fs.readFileSync(localUnowned, 'utf8') === 'must survive plugin-owned cleanup\n',
        owned_file_count: ownedBefore.length,
      };
      fs.rmSync(installedPath, { recursive: true, force: true });
    }
    assert.equal(snapshotTree(manager.plugins), sentinelBefore, 'only the intentionally added package roots and unowned notes changed');

    return {
      schema: 'titan.directadmin.staging-lifecycle/v1',
      environment: 'temporary-filesystem-model',
      plugins: pluginResults,
      negative_checks: negativeChecks,
      scope: { live_directadmin_touched: false, titan_business_authority_used: false, manager_operations_simulated: true },
      limitations: 'This archive-backed local filesystem model does not certify a real DirectAdmin Manager install, host service control, or live update endpoint.',
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.stdout.write(`${JSON.stringify(runStagingLifecycle())}\n`);
}
