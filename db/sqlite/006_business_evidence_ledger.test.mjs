import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const canonicalMigrations = [
  '001_canonical.sql',
  '002_agent_runtime.sql',
  '003_authority_persistence.sql',
  '004_worker_access.sql',
  '005_work_order_completion.sql',
];

function populatedPreLedgerDatabase(databasePath) {
  const db = new Database(databasePath);
  db.pragma('foreign_keys = ON');
  db.exec(readFileSync(join(repoRoot, 'db/sqlite/001_canonical.sql'), 'utf8'));
  const markApplied = db.prepare('INSERT INTO schema_migrations(filename) VALUES (?)');
  markApplied.run(canonicalMigrations[0]);
  for (const filename of canonicalMigrations.slice(1)) {
    db.exec(readFileSync(join(repoRoot, 'db/sqlite', filename), 'utf8'));
    markApplied.run(filename);
  }
  db.prepare('INSERT INTO companies(id,name) VALUES (?,?)').run('company-a', 'A');
  db.prepare('INSERT INTO companies(id,name) VALUES (?,?)').run('company-b', 'B');
  db.prepare(`INSERT INTO authority_decisions
    (company_id,authority_decision_id,worker_id,capability,decision,evaluated_at,payload)
    VALUES (?,?,?,?,?,?,?)`).run('company-a', 'authority-a', 'worker-a', 'work.complete', 'ALLOW', '2026-01-01T00:00:00Z', '{}');
  const insertEvidence = db.prepare(`INSERT INTO evidence
    (id,company_id,subject_type,subject_id,evidence_type,provenance,payload,created_at)
    VALUES (?,?,?,?,?,?,?,?)`);
  insertEvidence.run('legacy-a', 'company-a', 'job', 'job-a', 'visit_completed', '{"source":"legacy"}', '{"status":"completed"}', '2026-01-01T00:00:00Z');
  insertEvidence.run('legacy-b', 'company-b', 'job', 'job-b', 'provider_ack', '{"source":"square"}', '{"status":"received"}', '2026-01-02T00:00:00Z');
  db.close();
}

function runProductionMigrator(databasePath) {
  const result = spawnSync(process.execPath, ['scripts/sqlite-migrate.mjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, SQLITE_PATH: databasePath },
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}\n${result.error ?? ''}`);
}

test('business evidence migration preserves populated history, immutability, cleanup and backup restore', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'titan-evidence-migration-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const databasePath = join(directory, 'populated.sqlite');
  const backupPath = join(directory, 'restored.sqlite');
  populatedPreLedgerDatabase(databasePath);

  runProductionMigrator(databasePath);

  let db = new Database(databasePath);
  db.pragma('foreign_keys = ON');
  const migrated = db.prepare(`SELECT id,company_id,subject_type,subject_id,evidence_type,provenance,payload,
      evidence_version,classification,acceptance_state,event_type,verification_id,accepted_at
    FROM evidence ORDER BY id`).all();
  assert.deepEqual(migrated.map(row => row.id), ['legacy-a', 'legacy-b']);
  assert.deepEqual(migrated.map(row => [row.evidence_version, row.classification, row.acceptance_state]), [
    [1, 'factual', 'accepted'], [1, 'factual', 'accepted'],
  ]);
  assert.deepEqual(migrated.map(row => [row.event_type, row.verification_id, row.accepted_at]), [
    [null, null, null], [null, null, null],
  ]);
  assert.equal(migrated[0].payload, '{"status":"completed"}');
  assert.throws(() => db.prepare("UPDATE evidence SET payload='{}' WHERE id='legacy-a'").run(), /business-evidence-immutable/);
  assert.throws(() => db.prepare("DELETE FROM evidence WHERE id='legacy-a'").run(), /business-evidence-immutable/);
  assert.throws(() => db.prepare("UPDATE authority_decisions SET payload='{}' WHERE authority_decision_id='authority-a'").run(), /authority-history-immutable/);
  assert.equal(db.prepare("SELECT payload FROM authority_decisions WHERE authority_decision_id='authority-a'").get().payload, '{}');
  assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_master WHERE type=? AND name=?').get('trigger', 'evidence_no_update').n, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM sqlite_master WHERE type=? AND name=?').get('trigger', 'evidence_no_delete').n, 1);
  const applied = db.prepare('SELECT filename FROM schema_migrations ORDER BY filename').all().map(row => row.filename);
  assert.deepEqual(applied.filter(name => name.startsWith('00')), canonicalMigrations.concat([
    '006_business_evidence_ledger.sql', '007_business_evidence_company_delete_cascade.sql',
  ]));
  assert.deepEqual(db.pragma('foreign_key_check'), []);

  await db.backup(backupPath);
  db.close();
  const restored = new Database(backupPath);
  restored.pragma('foreign_keys = ON');
  assert.equal(restored.prepare('SELECT count(*) AS n FROM evidence').get().n, 2);
  assert.throws(() => restored.prepare("DELETE FROM evidence WHERE id='legacy-a'").run(), /business-evidence-immutable/);
  restored.prepare("DELETE FROM companies WHERE id='company-a'").run();
  assert.equal(restored.prepare("SELECT count(*) AS n FROM evidence WHERE company_id='company-a'").get().n, 0);
  assert.equal(restored.prepare('SELECT count(*) AS n FROM titan_company_delete_cascade_guard').get().n, 0);
  assert.equal(restored.pragma('integrity_check', { simple: true }), 'ok');
  assert.deepEqual(restored.pragma('foreign_key_check'), []);
  restored.close();

  runProductionMigrator(databasePath);
  db = new Database(databasePath);
  assert.deepEqual(db.prepare('SELECT filename FROM schema_migrations ORDER BY filename').all().map(row => row.filename), applied);
  assert.equal(db.prepare('SELECT count(*) AS n FROM evidence').get().n, 2);
  db.close();
});
