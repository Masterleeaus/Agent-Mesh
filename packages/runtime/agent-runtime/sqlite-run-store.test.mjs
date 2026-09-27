import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SqliteRunStore } from './sqlite-run-store.mjs';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

function storage(filename = ':memory:') {
  const db = new Database(filename);
  return {
    async query(sql, params=[]) { const bound=[]; const text=sql.replace(/\$(\d+)/g,(_,index)=>{bound.push(params[Number(index)-1]);return '?'}); const s=db.prepare(text); if(s.reader){const rows=s.all(...bound);return {rows,rowCount:rows.length}} const r=s.run(...bound);return {rows:[],rowCount:r.changes}; },
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

test('waiting runs recover from a reopened SQLite file without recovering terminal runs', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'titan-runs-'));
  const filename = join(directory, 'runs.sqlite');
  try {
    const first = storage(filename);
    const store = new SqliteRunStore(first);
    const base = { company_id: 'c1', conversation_id: 'conversation', agent_id: 'agent',
      work_id: 'work', actor_id: 'actor', updated_at: new Date().toISOString() };
    await store.create({ ...base, run_id: 'approval', state: 'WAITING_APPROVAL', wait: { decision_id: 'd1' } });
    await store.create({ ...base, run_id: 'external', state: 'WAITING_EXTERNAL', wait: { execution_id: 'e1' } });
    await store.create({ ...base, run_id: 'terminal', state: 'COMPLETED' });
    await first.close();

    const second = storage(filename);
    const restarted = new SqliteRunStore(second);
    assert.deepEqual((await restarted.recoverable('c1')).map(run => run.run_id).sort(), ['approval', 'external']);
    assert.equal((await restarted.get('c1', 'approval')).wait.decision_id, 'd1');
    assert.equal((await restarted.get('c2', 'approval')), null);
    await assert.rejects(restarted.save({ ...base, run_id: 'unknown', state: 'RUNNING' }), /runtime-run-not-found/);
    await second.close();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
