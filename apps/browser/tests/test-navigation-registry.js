const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = vm.createContext({ console, globalThis: {} });
context.globalThis = context;
vm.runInContext(fs.readFileSync('src/lib/navigation-registry.js', 'utf8'), context, { filename: 'navigation-registry.js' });

const registry = context.CodeeNavigationRegistry;
assert(registry, 'CodeeNavigationRegistry must exist');
registry.clear();
registry.installDefaults();

const entries = registry.list();
assert(entries.length >= 11, 'default navigation should include groups and current/future pages');
const runner = registry.get('workspace.runner');
assert(runner, 'runner navigation entry must exist');
assert.strictEqual(runner.page, 'runner');
assert.strictEqual(runner.parent, 'group.workspace');
assert(Object.isFrozen(runner), 'registry records must be deeply immutable');
assert(Object.isFrozen(runner.capabilityRequirements), 'nested arrays must be immutable');

assert.throws(() => registry.register({ ...runner }), /duplicate navigation id/i, 'duplicate ids must fail closed');

registry.clear();
registry.registerMany([
  { id: 'group.a', kind: 'group', label: 'A', order: 10 },
  { id: 'a.one', kind: 'page', label: 'One', parent: 'group.a', page: 'one', order: 10, readiness: 'AVAILABLE' },
  { id: 'a.two', kind: 'page', label: 'Two', parent: 'group.a', page: 'one', order: 20, readiness: 'AVAILABLE' },
  { id: 'a.orphan', kind: 'page', label: 'Orphan', parent: 'group.missing', page: 'orphan', order: 30, readiness: 'AVAILABLE' }
]);
const invalid = registry.validate({ availableViews: ['one'] });
assert.strictEqual(invalid.ok, false);
assert(invalid.errors.some(row => row.code === 'DUPLICATE_DESTINATION'), 'duplicate page destinations must be reported');
assert(invalid.errors.some(row => row.code === 'MISSING_PARENT'), 'missing parent must be reported');
assert(invalid.errors.some(row => row.code === 'VIEW_UNAVAILABLE' && row.id === 'a.orphan'), 'required unavailable views must be reported');

registry.clear();
registry.installDefaults();
const valid = registry.validate({ availableViews: ['dashboard','runner','plans','history','artifacts','intelligence','workforce','repository','titan-zero','browser','connections','mcp','repository-host','prompts','skills','knowledge','settings','diagnostics','about'] });
assert.strictEqual(valid.ok, true, JSON.stringify(valid.errors));
console.log(`Navigation registry validated ${registry.list().length} canonical entries`);
