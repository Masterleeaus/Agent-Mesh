const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = vm.createContext({ console, globalThis: {} });
context.globalThis = context;
const source = fs.readFileSync('src/browser/browser-capability-contract.js', 'utf8');
vm.runInContext(source, context, { filename: 'src/browser/browser-capability-contract.js' });

const contract = context.CodeeBrowserCapabilityContract;
assert(contract, 'browser capability contract must be exported');
assert.strictEqual(contract.PACK_ID, 'codee-browser-control-engine');
assert.strictEqual(contract.CONTRACT_VERSION, '1.0.0');

const capabilities = contract.list();
assert(Array.isArray(capabilities) && capabilities.length >= 35, 'contract must define the complete browser capability surface');
assert.strictEqual(new Set(capabilities.map(row => row.id)).size, capabilities.length, 'browser capability IDs must be unique');

const required = [
  'browser.tabs','browser.connect','browser.disconnect','browser.snapshot','browser.page_markdown','browser.find','browser.text','browser.screenshot',
  'browser.navigate','browser.back','browser.forward','browser.reload','browser.viewport.set','browser.viewport.reset',
  'browser.click','browser.double_click','browser.hover','browser.focus','browser.type','browser.insert_text','browser.clear','browser.press_key','browser.select','browser.scroll','browser.drag','browser.fill_form',
  'browser.dialog.current','browser.dialog.accept','browser.dialog.dismiss',
  'browser.console.latest','browser.console.errors','browser.console.clear',
  'browser.network.list','browser.network.errors','browser.network.request','browser.network.response_body',
  'browser.react_source','browser.styles','browser.compose','browser.evaluate'
];
for (const id of required) assert(capabilities.some(row => row.id === id), `missing canonical capability ${id}`);

const permissionClasses = new Set(['tab_metadata','tab_session','page_read','page_navigation','page_interact','page_diagnostics','developer_execute']);
const operationClasses = new Set(['READ','SESSION','INTERACT','NAVIGATE','EXECUTE']);
const auditClasses = new Set(['none','session','action','privileged']);
const riskLevels = new Set(['low','medium','high','critical']);
for (const row of capabilities) {
  assert(/^browser\.[a-z0-9_.]+$/.test(row.id), `invalid capability id ${row.id}`);
  assert(row.title && typeof row.title === 'string', `${row.id} requires title`);
  assert(permissionClasses.has(row.permissionClass), `${row.id} has invalid permissionClass`);
  assert(operationClasses.has(row.operationClass), `${row.id} has invalid operationClass`);
  assert(auditClasses.has(row.audit), `${row.id} has invalid audit policy`);
  assert(riskLevels.has(row.risk), `${row.id} has invalid risk`);
  assert(Number.isInteger(row.timeoutMs) && row.timeoutMs >= 1000 && row.timeoutMs <= 120000, `${row.id} timeout must be bounded`);
  assert(row.inputSchema && row.inputSchema.type === 'object', `${row.id} requires object input schema`);
  assert(row.outputSchema && row.outputSchema.type === 'object', `${row.id} requires object output schema`);
  assert(Array.isArray(row.requiredChromePermissions), `${row.id} requires declarative chrome permissions`);
  assert(row.implementation && ['contract_only','implemented'].includes(row.implementation.status), `${row.id} must declare implementation status`);
  assert.strictEqual(row.implementation.owner, 'browser-control-engine');
  assert.strictEqual(row.authority.mayAdvancePlan, false);
  assert.strictEqual(row.authority.mayMutateRepository, false);
  assert.strictEqual(row.authority.implementsMcpRuntime, false);
  assert.strictEqual(row.readOnly, row.operationClass === 'READ', `${row.id} readOnly must match operation class`);
}

assert.strictEqual(contract.get('browser.evaluate').risk, 'critical');
assert.strictEqual(contract.get('browser.evaluate').permissionClass, 'developer_execute');
assert.strictEqual(contract.get('browser.evaluate').audit, 'privileged');
assert.strictEqual(contract.get('browser.snapshot').readOnly, true);
assert.strictEqual(contract.get('browser.click').readOnly, false);

// Returned records must not mutate canonical contract state.
const first = contract.get('browser.click');
try { first.risk = 'low'; } catch {}
assert.strictEqual(contract.get('browser.click').risk, 'medium');

console.log(`Browser capability contract defines ${capabilities.length} immutable canonical capabilities`);
