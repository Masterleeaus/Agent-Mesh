import test from 'node:test';
import assert from 'node:assert/strict';
import { createSqliteStorage, forCompany } from '../packages/storage/src/index.ts';

test('overlapping SQLite transactions cannot roll back another request',async()=>{
 const storage=createSqliteStorage(':memory:');
 try {
  await storage.query('CREATE TABLE records(id TEXT PRIMARY KEY)');
  const a=storage.transaction(async tx=>{await tx.query("INSERT INTO records VALUES('a')");await Promise.resolve();});
  const b=storage.transaction(async tx=>{await tx.query("INSERT INTO records VALUES('b')");throw Error('abort-b');});
  const outcomes=await Promise.allSettled([a,b]);
  assert.equal(outcomes[0].status,'fulfilled');assert.equal(outcomes[1].status,'rejected');
  assert.deepEqual((await storage.query('SELECT id FROM records')).rows,[{id:'a'}]);
  await forCompany(storage,'a').transaction(tx=>tx.query("INSERT INTO records VALUES('c')"));
 }finally{await storage.close();}
});

test('a concurrent request write is not silently enlisted in another SQLite rollback',async()=>{
 const storage=createSqliteStorage(':memory:');
 try {
  await storage.query('CREATE TABLE records(id TEXT PRIMARY KEY)');
  const abort=storage.transaction(async tx=>{await tx.query("INSERT INTO records VALUES('abort')");await Promise.resolve();throw Error('abort');});
  const keep=storage.query("INSERT INTO records VALUES('keep')");
  await Promise.allSettled([abort,keep]);
  assert.deepEqual((await storage.query('SELECT id FROM records')).rows,[{id:'keep'}]);
 }finally{await storage.close();}
});
