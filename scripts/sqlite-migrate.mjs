// TRANSITIONAL COMPATIBILITY MIGRATOR.
// This applies the historical mixed db/sqlite migration stream to one SQLITE_PATH.
// It is not the canonical database-per-company provisioning path: migration 001
// mixes native FSM business tables with registry/authority/evidence concerns and
// later files add runtime/control state. New company provisioning must use the
// owner-classified migration path owned by #809/#811/#322. Do not point this at
// an isolated company database until that classification/split is implemented.

import Database from 'better-sqlite3';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const file = resolve(process.env.SQLITE_PATH ?? '.titan/data/titan-zero.db');
mkdirSync(dirname(file), { recursive: true });
const db = new Database(file);
db.pragma('journal_mode = WAL'); db.pragma('foreign_keys = ON'); db.pragma('busy_timeout = 5000'); db.pragma('synchronous = NORMAL');
db.exec('CREATE TABLE IF NOT EXISTS schema_migrations(filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
for (const filename of readdirSync('db/sqlite').filter(x => x.endsWith('.sql')).sort()) {
  const seen = db.prepare('SELECT 1 FROM schema_migrations WHERE filename=?').get(filename);
  if (seen) { console.log(`skipping: ${filename}`); continue; }
  const sql = readFileSync(`db/sqlite/${filename}`, 'utf8');
  db.transaction(() => { db.exec(sql); db.prepare('INSERT INTO schema_migrations(filename) VALUES(?)').run(filename); })();
  console.log(`applied: ${filename}`);
}
const check = db.pragma('integrity_check', { simple: true });
if (check !== 'ok') throw new Error(`SQLite integrity_check failed: ${check}`);
db.close(); console.log(`SQLite ready: ${file}`);
