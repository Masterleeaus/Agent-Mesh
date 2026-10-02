import { afterEach, describe, expect, it } from 'vitest';
import { createSqliteStorage, forCompany, normalizeCompanyContext } from './index.js';
const stores: ReturnType<typeof createSqliteStorage>[] = [];
afterEach(async () => { for (const s of stores.splice(0)) await s.close(); });
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
  it('requires an explicit company for company-scoped access', () => { const s=createSqliteStorage(':memory:'); stores.push(s); expect(() => forCompany(s,'')).toThrow(/company_id/); });
});
