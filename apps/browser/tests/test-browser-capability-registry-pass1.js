const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const context = vm.createContext({ console, globalThis: {} });
context.globalThis = context;
for (const file of ['src/lib/capability-registry.js','src/browser/browser-capability-contract.js','src/lib/browser-host-integration.js']) {
  vm.runInContext(fs.readFileSync(file,'utf8'), context, { filename: file });
}
assert(context.CodeeBrowserHostIntegration, 'browser host integration must exist');
const result = context.CodeeBrowserHostIntegration.register();
assert.strictEqual(result.registered, true);
assert.strictEqual(result.contractOnly, 12);
const snapshot = context.CodeeCapabilityRegistry.snapshot();
const rows = snapshot.capabilities.filter(row => row.pack === 'codee-browser-control-engine');
assert.strictEqual(rows.length, context.CodeeBrowserCapabilityContract.list().length, 'all browser contracts must register once');
for (const row of rows) {
  assert(row.inputSchema && row.outputSchema, `${row.id} schemas must survive registry registration`);
  assert(['contract_only','implemented'].includes(row.implementation.status));
  assert.strictEqual(row.authority.mayAdvancePlan, false);
}
const second = context.CodeeBrowserHostIntegration.register();
assert.strictEqual(second.registered, true);
assert.strictEqual(context.CodeeCapabilityRegistry.snapshot().capabilities.filter(row => row.pack === 'codee-browser-control-engine').length, rows.length, 'registration must be idempotent');
const status = context.CodeeBrowserHostIntegration.statusPayload();
assert.strictEqual(status.registered, true);
assert(status.implemented > 0, 'browser execution implementations must remain represented');
assert.strictEqual(status.contractOnly + status.implemented, rows.length);
assert.strictEqual(status.authority.mayAdvancePlan, false);
console.log(`Browser capability registry registered ${rows.length} contract-only capabilities idempotently`);
