const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = vm.createContext({ console, globalThis: {} });
context.globalThis = context;
for (const file of ['src/lib/navigation-registry.js','src/lib/navigation-readiness.js']) {
  vm.runInContext(fs.readFileSync(file,'utf8'), context, { filename:file });
}
const registry = context.CodeeNavigationRegistry;
registry.clear();
registry.installDefaults();
const entries = registry.list();
const groups = entries.filter(row => row.kind === 'group').sort((a,b) => a.order-b.order);
assert.deepStrictEqual(Array.from(groups, row => row.label), ['Titan Zero','Workforce','Systems','Browser Node']);

const expected = {
  'group.zero': [
    ['zero.overview','Zero','dashboard','AVAILABLE'],
    ['zero.work','Work','runner','AVAILABLE'],
    ['zero.active-work','Active Work','plans','AVAILABLE'],
    ['zero.outcomes','Outcomes','history','AVAILABLE'],
    ['zero.evidence','Evidence','artifacts','AVAILABLE']
  ],
  'group.workforce': [
    ['workforce.control','Workforce','workforce','AVAILABLE'],
    ['workforce.browser','Browser','browser','AVAILABLE'],
    ['workforce.intelligence','Intelligence','intelligence','AVAILABLE']
  ],
  'group.systems': [
    ['systems.connections','Connections','connections','AVAILABLE'],
    ['systems.mcp','Tools & MCP','mcp','AVAILABLE'],
    ['systems.knowledge','Knowledge','knowledge','AVAILABLE']
  ],
  'group.node': [
    ['node.diagnostics','Diagnostics','diagnostics','AVAILABLE'],
    ['node.settings','Settings','settings','AVAILABLE'],
    ['node.about','About','about','AVAILABLE']
  ]
};
for (const [parent, rows] of Object.entries(expected)) {
  const actual = entries.filter(row => row.kind === 'page' && row.parent === parent).sort((a,b) => a.order-b.order);
  assert.strictEqual(actual.length, rows.length, `${parent} child count`);
  assert.deepStrictEqual(Array.from(actual, row => [row.id,row.label,row.page,row.readiness]), rows, `${parent} ordering/content`);
}
assert.strictEqual(entries.filter(row => row.kind === 'page').length, 14, 'Browser Node navigation must expose only operational pages');

const availableViews = ['dashboard','runner','plans','history','artifacts','intelligence','workforce','browser','connections','mcp','knowledge','settings','diagnostics','about'];
const validation = registry.validate({ availableViews });
assert.strictEqual(validation.ok, true, JSON.stringify(validation.errors));
const resolved = context.CodeeNavigationReadiness.resolveAll(entries, {
  availableViews,
  capabilities:['browser.snapshot','ai.gateway.status'],
  dependencies:{}
});
assert.strictEqual(resolved.find(row => row.id === 'zero.work').resolved.interactive, true);
assert.strictEqual(resolved.find(row => row.id === 'zero.overview').resolved.state, 'AVAILABLE');
assert.strictEqual(resolved.find(row => row.id === 'workforce.browser').resolved.state, 'AVAILABLE');
assert.strictEqual(resolved.find(row => row.id === 'systems.connections').resolved.interactive, true);
assert.strictEqual(resolved.find(row => row.id === 'systems.mcp').resolved.interactive, true);
assert(!entries.some(row => ['repository','titan-zero','repository-host','prompts','skills'].includes(row.page)), 'development-only pages must not be exposed in Browser Node navigation');
console.log('Titan Zero Browser Node navigation is operational, company-oriented and free of development-only menu surfaces');
