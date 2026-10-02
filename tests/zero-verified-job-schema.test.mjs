import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

test('the installed SQLite schema supports company-scoped assigned work-order completion', () => {
  const db = new Database(':memory:');
  try {
    for (const file of readdirSync(resolve('db/sqlite')).filter(f => f.endsWith('.sql')).sort()) db.exec(readFileSync(resolve('db/sqlite', file), 'utf8'));
    db.prepare("INSERT INTO companies(id,name) VALUES('a','A'),('b','B')").run();
    db.prepare("INSERT INTO users(id,company_id,email,full_name,password_hash,role) VALUES('lead','a','lead@example.invalid','Lead','fixture','tech')").run();
    db.prepare("INSERT INTO clients(id,company_id,name) VALUES('client','a','Client')").run();
    db.prepare("INSERT INTO jobs(id,company_id,client_id,title,created_by) VALUES('job','a','client','Job','lead')").run();
    db.prepare("INSERT INTO work_orders(id,company_id,job_id,client_id,title,assigned_user_id,created_by) VALUES('wo','a','job','client','Work','lead','lead')").run();
    assert.equal(db.prepare("SELECT count(*) AS n FROM work_orders WHERE company_id='a' AND assigned_user_id='lead'").get().n, 1);
    assert.equal(db.prepare("SELECT count(*) AS n FROM work_orders WHERE company_id='b'").get().n, 0);
    assert.throws(() => db.prepare("INSERT INTO work_orders(id,company_id,job_id,client_id,title,assigned_user_id,created_by) VALUES('cross','b','job','client','Wrong','lead','lead')").run(), /FOREIGN KEY/);
  } finally { db.close(); }
});
