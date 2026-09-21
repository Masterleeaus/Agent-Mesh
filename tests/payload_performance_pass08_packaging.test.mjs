import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const audit = JSON.parse(fs.readFileSync(path.join(root, 'titan-runtime/performance/packaging-optimization-audit-merge42.json'), 'utf8'));

test('Pass8 audit prefers source-preserving level-9 compression only', () => {
  assert.ok(audit.compression.deflate_level_9_bytes < audit.compression.deflate_level_6_bytes);
  assert.equal(audit.protected_compiled_assets.policy, 'DO_NOT_MINIFY_OR_REBUNDLE_IN_PASS8');
  assert.equal(audit.titan_owned_source.minification_decision, 'KEEP_READABLE');
});

test('Pass8 removes only disposable command-output artifacts', () => {
  assert.deepEqual(audit.temporary_build_artifacts.retire_now, ['pytest.out', 'node-tests.out', '.pytest_cache/**', 'tests/__pycache__/**']);
  for (const rel of audit.temporary_build_artifacts.retire_now) {
    assert.equal(fs.existsSync(path.join(root, rel)), false, `${rel} must be retired`);
  }
});

test('Pass8 keeps protected compatibility and Retriever files', () => {
  for (const rel of audit.protected_compiled_assets.paths) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, `${rel} must remain`);
  }
});

test('Pass8 keeps destructive Retriever tree-shaking gated', () => {
  assert.equal(audit.tree_shaking.runtime_adapters_manager_converged, false);
  assert.equal(audit.tree_shaking.destructive_donor_tree_shaking, 'BLOCKED_UNTIL_MANAGER_MERGE');
});

test('Pass8 is authority and company-boundary neutral', () => {
  assert.equal(audit.authority_effect, false);
  assert.equal(audit.company_boundary_effect, false);
});
