import { DatabaseSync } from 'node:sqlite';

function rewrite(sql, params) {
  const values = [];
  const text = sql.replace(/\$(\d+)/g, (_match, rawIndex) => {
    const index = Number(rawIndex) - 1;
    if (index < 0 || index >= params.length) throw new Error(`sqlite parameter $${rawIndex} is not bound`);
    values.push(params[index]);
    return '?';
  });
  return { sql: text, params: values };
}

/** Test-only StorageClient using Node's bundled SQLite engine. It mirrors the
 * production wrapper's WAL, busy timeout and BEGIN IMMEDIATE semantics. */
export function createSqliteStorage(filename) {
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA synchronous=NORMAL');
  let pending = Promise.resolve();
  const serialize = operation => {
    const result = pending.then(operation);
    pending = result.then(() => undefined, () => undefined);
    return result;
  };
  const directQuery = (sql, params = []) => {
    const rewritten = rewrite(sql, params);
    const statement = db.prepare(rewritten.sql);
    if (statement.columns().length > 0) {
      const rows = statement.all(...rewritten.params);
      return { rows, rowCount: rows.length };
    }
    const result = statement.run(...rewritten.params);
    return { rows: [], rowCount: Number(result.changes) };
  };
  const client = {
    dialect: 'sqlite',
    query(sql, params = []) { return serialize(() => directQuery(sql, params)); },
    transaction(work) {
      return serialize(async () => {
        db.exec('BEGIN IMMEDIATE');
        let active = true;
        const tx = {
          dialect: 'sqlite',
          query(sql, params = []) {
            if (!active) return Promise.reject(new Error('sqlite-transaction-closed'));
            return Promise.resolve(directQuery(sql, params));
          },
          async transaction() { throw new Error('sqlite-nested-transaction-unsupported'); },
          async close() { throw new Error('sqlite-transaction-does-not-own-connection'); },
        };
        try {
          const result = await work(tx);
          db.exec('COMMIT');
          return result;
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        } finally {
          active = false;
        }
      });
    },
    close() { return serialize(async () => db.close()); },
  };
  return client;
}
