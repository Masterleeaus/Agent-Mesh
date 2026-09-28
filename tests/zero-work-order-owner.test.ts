import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import Database from 'better-sqlite3';
import { assertAssignedLead } from '../apps/web/lib/work-orders/lead-access.ts';
import { loadWorkOrderCompletionCriteria } from '../apps/web/lib/work-orders/task-time.ts';

test('assigned lead and stored legacy checklist are usable on real SQLite', async () => {
 const db = new Database(':memory:');
 const client = { dialect: 'sqlite' as const, async query(sql: string, params: unknown[] = []) {
   const bound: unknown[]=[]; const text=sql.replace(/\$(\d+)/g, (_, n) => {bound.push(params[Number(n)-1]);return '?';});
   const stmt=db.prepare(text); if(stmt.reader){const rows=stmt.all(...bound);return {rows,rowCount:rows.length};} return {rows:[],rowCount:stmt.run(...bound).changes};
 }};
 try {
  for(const f of readdirSync(new URL('../db/sqlite', import.meta.url)).filter(f=>f.endsWith('.sql')).sort()) db.exec(readFileSync(new URL('../db/sqlite/'+f, import.meta.url),'utf8'));
  db.exec("INSERT INTO companies(id,name) VALUES('a','A'); INSERT INTO users(id,company_id,email,full_name,password_hash,role) VALUES('lead','a','l@example.invalid','Lead','fixture','tech'); INSERT INTO clients(id,company_id,name) VALUES('client','a','Client'); INSERT INTO jobs(id,company_id,client_id,title,created_by) VALUES('job','a','client','Job','lead');");
  db.prepare("INSERT INTO work_orders(id,company_id,job_id,client_id,title,assigned_user_id,created_by,completion_criteria) VALUES('wo','a','job','client','Work','lead','lead',?)").run(JSON.stringify([{id:'required',label:'Required evidence',required:true,completed:false}]));
  const wo=await assertAssignedLead(client as any,'wo','a','lead');
  assert.ok(wo);
  assert.equal(await assertAssignedLead(client as any,'wo','b','lead'),null);
  const criteria=await loadWorkOrderCompletionCriteria(client as any,'wo','a',wo.completion_criteria);
  assert.equal(criteria.length,1);
  assert.equal(Boolean(criteria[0].completed),false);
 } finally {db.close();}
});
