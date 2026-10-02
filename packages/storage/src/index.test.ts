import { afterEach, describe, expect, it } from 'vitest';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSqliteStorage, forCompany, normalizeCompanyContext } from './index.js';
const stores: ReturnType<typeof createSqliteStorage>[] = [];
const tempDirs: string[] = [];
afterEach(async () => { for (const s of stores.splice(0)) await s.close(); for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
describe('SQLite storage', () => {
  it('normalizes legacy tenant input to canonical company_id', () => expect(normalizeCompanyContext({tenant_company_id:'c1'})).toBe('c1'));
  it('rejects missing company context', () => expect(() => normalizeCompanyContext({})).toThrow(/company_id/));
  it('persists and rolls transactions back', async () => {
    const s=createSqliteStorage(':memory:'); stores.push(s); await s.query('CREATE TABLE x(id TEXT PRIMARY KEY, company_id TEXT NOT NULL)');
    await s.query('INSERT INTO x VALUES($1,$2)', ['a','c1']);
    await expect(s.transaction(async tx => { await tx.query('INSERT INTO x VALUES($1,$2)',['b','c1']); throw new Error('rollback'); })).rejects.toThrow('rollback');
    expect((await s.query('SELECT * FROM x')).rowCount).toBe(1);
  });
  it('does not enter a transaction when its absolute acquisition deadline has expired', async () => {
    const s=createSqliteStorage(':memory:'); stores.push(s);
    let entered=false;
    await expect(s.transaction(async () => { entered=true; }, { acquireDeadlineMs: performance.now() - 1 }))
      .rejects.toThrow('storage-transaction-acquire-timeout');
    expect(entered).toBe(false);
  });
  it('bounds a native SQLite writer lock held by another process', async () => {
    const dir=mkdtempSync(join(tmpdir(),'titan-storage-fence-')); tempDirs.push(dir);
    const filename=join(dir,'lock.db'); const s=createSqliteStorage(filename); stores.push(s);
    const child=spawn(process.execPath,['-e',`const Database=require('better-sqlite3');const db=new Database(${JSON.stringify(filename)});db.exec('BEGIN IMMEDIATE');process.stdout.write('locked\\n');setTimeout(()=>{db.exec('ROLLBACK');db.close()},700);`],{stdio:['ignore','pipe','inherit']});
    assert.ok(child.stdout);
    await new Promise<void>((resolve,reject)=>{let output='';child.stdout!.setEncoding('utf8');child.stdout!.on('data',chunk=>{output+=chunk;if(output.includes('locked\\n'))resolve();});child.once('error',reject);child.once('exit',code=>{if(code!==null&&code!==0)reject(new Error(`lock-holder-exit:${code}`));});});
    try {
      let entered=false; const started=performance.now();
      await expect(s.transaction(async()=>{entered=true;},{acquireDeadlineMs:started+180})).rejects.toThrow('storage-transaction-acquire-timeout');
      expect(entered).toBe(false);
      expect(performance.now()-started).toBeLessThan(600);
    } finally {
      child.kill();
      if (child.exitCode === null) await new Promise<void>(resolve=>child.once('exit',()=>resolve()));
    }
  });
  it('requires an explicit company for company-scoped access', () => { const s=createSqliteStorage(':memory:'); stores.push(s); expect(() => forCompany(s,'')).toThrow(/company_id/); });
});
