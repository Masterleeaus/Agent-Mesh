const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = vm.createContext({ console, globalThis: {} });
context.globalThis = context;
vm.runInContext(fs.readFileSync('src/lib/navigation-registry.js', 'utf8'), context, { filename: 'navigation-registry.js' });

const registry = context.CodeeNavigationRegistry;
assert(registry, 'CodeeNavigationRegistry compatibility alias must exist');
assert.strictEqual(context.TitanZeroBrowserNavigationRegistry, registry, 'Titan Zero navigation alias must be canonical');
registry.clear();
registry.installDefaults();

const entries = registry.list();
assert(entries.length >= 10, 'default navigation should include Titan Zero groups and operational pages');
const work = registry.get('zero.work');
assert(work, 'Titan Zero Work navigation entry must exist');
assert.strictEqual(work.page, 'runner');
assert.strictEqual(work.parent, 'group.zero');
assert(Object.isFrozen(work), 'registry records must be deeply immutable');
assert(Object.isFrozen(work.capabilityRequirements), 'nested arrays must be immutable');
assert.throws(() => registry.register({ ...work }), /duplicate navigation id/i, 'duplicate ids must fail closed');

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
const operationalViews = ['dashboard','runner','plans','history','artifacts','intelligence','workforce','browser','connections','mcp','knowledge','settings','diagnostics','about'];
const valid = registry.validate({ availableViews: operationalViews });
assert.strictEqual(valid.ok, true, JSON.stringify(valid.errors));
assert.strictEqual(registry.get('intelligence.repository'), null, 'development repository page must not be in Browser Node navigation');
assert.strictEqual(registry.get('knowledge.prompts'), null, 'development prompt library must not be in Browser Node navigation');
assert.strictEqual(registry.get('knowledge.skills'), null, 'development skills library must not be in Browser Node navigation');
console.log(`Titan Zero Browser Node navigation validated ${registry.list().length} canonical entries`);
