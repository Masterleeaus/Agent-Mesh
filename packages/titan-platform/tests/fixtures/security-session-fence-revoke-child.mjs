import { IdentitySessionRegistry } from '../../.test-dist/security-boundary.js';
import { createSqliteStorage } from './sqlite-storage.mjs';
const storage = createSqliteStorage(process.argv[2]);
const registry = new IdentitySessionRegistry(storage);
process.send?.({ type: 'attempting' });
try {
  await registry.revokeSession(process.argv[3], Number(process.argv[4]));
  process.send?.({ type: 'done' });
  process.exitCode = 0;
} catch (error) {
  process.send?.({ type: 'error', message: error instanceof Error ? error.message : 'unknown' });
  process.exitCode = 1;
} finally {
  await storage.close();
}
