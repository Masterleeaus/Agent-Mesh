import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const command = path.join(root, 'scripts/directadmin-plugin-staging-lifecycle.mjs');
const pluginIds = ['titan-server-node', 'titan_dev_access', 'titan_workforce'];

test('three-plugin temporary staging lifecycle preserves package and rollback evidence', async (t) => {
  const result = spawnSync(process.execPath, [command], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout || `exit ${result.status}`);
  const report = JSON.parse(result.stdout);
  assert.equal(report.schema, 'titan.directadmin.staging-lifecycle/v1');
  assert.equal(report.environment, 'temporary-filesystem-model');
  assert.deepEqual(report.plugins.map(({ id }) => id), pluginIds);
  assert.equal(report.scope.live_directadmin_touched, false);
  assert.equal(report.scope.titan_business_authority_used, false);
  await t.test('archives install twice, update and rollback restore exact content and modes', () => {
    for (const plugin of report.plugins) {
      assert.equal(plugin.archive.archive_root_manifest_verified, true, plugin.id);
      assert.equal(plugin.archive.executable_modes_verified, true, plugin.id);
      assert.equal(plugin.lifecycle.install, 'installed', plugin.id);
      assert.equal(plugin.lifecycle.reinstall, 'unchanged', plugin.id);
      assert.equal(plugin.lifecycle.update, 'updated', plugin.id);
      assert.equal(plugin.lifecycle.rollback, 'restored', plugin.id);
      assert.equal(plugin.rollback_evidence.baseline_tree_sha256, plugin.rollback_evidence.restored_tree_sha256, plugin.id);
      assert.equal(plugin.rollback_evidence.modes_restored, true, plugin.id);
    }
  });
  await t.test('uninstall removes owned package and manager state but preserves unrelated files', () => {
    for (const plugin of report.plugins) {
      assert.equal(plugin.lifecycle.uninstall, 'removed', plugin.id);
      assert.equal(plugin.cleanup.package_owned_files_remaining, 0, plugin.id);
      assert.equal(plugin.cleanup.manager_state_remaining, false, plugin.id);
      assert.equal(plugin.cleanup.unowned_sentinel_preserved, true, plugin.id);
      assert.equal(plugin.cleanup.unowned_plugin_note_preserved, true, plugin.id);
    }
  });
  await t.test('unsafe archive, absent metadata, and denied filesystem access fail before mutation', () => {
    assert.match(report.negative_checks.path_traversal.error, /unsafe archive path/i);
    assert.equal(report.negative_checks.path_traversal.state_unchanged, true);
    assert.match(report.negative_checks.missing_metadata.error, /plugin\.conf.*root/i);
    assert.equal(report.negative_checks.missing_metadata.state_unchanged, true);
    assert.equal(report.negative_checks.insufficient_filesystem_privilege.state_unchanged, true);
    if (report.negative_checks.insufficient_filesystem_privilege.verified) {
      assert.match(report.negative_checks.insufficient_filesystem_privilege.error, /filesystem write capability/i);
    } else {
      assert.match(report.negative_checks.insufficient_filesystem_privilege.skipped, /root/i);
    }
    assert.equal(report.negative_checks.directadmin_role_privilege_used, false);
  });
  assert.match(report.limitations, /does not certify a real DirectAdmin Manager install/i);
});
