import Database from "better-sqlite3";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const url = process.env.DATABASE_URL || "file:./data/titan-zero.db";
if (!url.startsWith("file:") && !url.startsWith("sqlite:")) {
  throw new Error("sqlite-migrate requires a file: or sqlite: DATABASE_URL");
}
const raw = url.replace(/^(file:|sqlite:)/, "").replace(/^\/\//, "");
const dbPath = raw === ":memory:" ? ":memory:" : resolve(process.cwd(), raw);
if (dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.pragma("synchronous = NORMAL");
db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

const migrationDir = resolve(process.cwd(), "db/sqlite");
const files = readdirSync(migrationDir).filter((f) => /^\d+.*\.sql$/.test(f)).sort();
const applied = db.prepare("SELECT 1 FROM schema_migrations WHERE version = ?");
const record = db.prepare("INSERT INTO schema_migrations(version) VALUES (?)");

for (const file of files) {
  if (applied.get(file)) continue;
  const sql = readFileSync(resolve(migrationDir, file), "utf8");
  const migrate = db.transaction(() => {
    db.exec(sql);
    record.run(file);
  });
  migrate();
  console.log(`[sqlite] applied ${file}`);
}

const integrity = db.pragma("integrity_check", { simple: true });
if (integrity !== "ok") throw new Error(`SQLite integrity_check failed: ${integrity}`);
console.log(`[sqlite] ready ${dbPath}`);
db.close();
