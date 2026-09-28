import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { SqliteRunStore } from './sqlite-run-store.mjs';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

function storage() {
  const db = new Database(':memory:');
  return {
    async query(sql, params=[]) { const bound=[]; const s=db.prepare(sql.replace(/\$(\d+)/g,(_,index)=>{bound.push(params[Number(index)-1]);return '?';})); if(s.reader){const rows=s.all(...bound);return {rows,rowCount:rows.length}} const r=s.run(...bound);return {rows:[],rowCount:r.changes}; },
    async close(){db.close();}
  };
}

test('SQLite RunStore persists and isolates runs by company', async () => {
  const db=storage(); const store=new SqliteRunStore(db);
  const run={company_id:'c1',run_id:'r1',state:'WAITING_EXTERNAL',conversation_id:'conv1',agent_id:'a1',work_id:'w1',updated_at:new Date().toISOString()};
  await store.create(run);
  assert.equal((await store.get('c1','r1')).state,'WAITING_EXTERNAL');
  assert.equal(await store.get('c2','r1'),null);
  assert.equal((await store.recoverable('c1')).length,1);
  run.state='COMPLETED'; run.updated_at=new Date().toISOString(); await store.save(run);
  assert.equal((await store.recoverable('c1')).length,0);
  await db.close();
});
