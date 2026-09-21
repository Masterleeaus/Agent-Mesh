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
assert.deepStrictEqual(Array.from(groups, row => row.label), ['Workspace','Intelligence','Infrastructure','Knowledge','System']);

const expected = {
  'group.workspace': [
    ['workspace.dashboard','Dashboard','dashboard','AVAILABLE'],
    ['workspace.runner','Runner','runner','AVAILABLE'],
    ['workspace.plans','Active Plans','plans','AVAILABLE'],
    ['workspace.history','History','history','AVAILABLE'],
    ['workspace.artifacts','Artifacts','artifacts','AVAILABLE']
  ],
  'group.intelligence': [
    ['intelligence.brain','Intelligence','intelligence','AVAILABLE'],
    ['intelligence.workforce','AI Workforce','workforce','AVAILABLE'],
    ['intelligence.repository','Repository','repository','AVAILABLE'],
    ['intelligence.titan','Titan Zero','titan-zero','AVAILABLE'],
    ['intelligence.browser','Browser','browser','AVAILABLE']
  ],
  'group.infrastructure': [
    ['infrastructure.connections','Connections','connections','AVAILABLE'],
    ['infrastructure.mcp','MCP','mcp','AVAILABLE'],
    ['infrastructure.repository-host','Repository Host','repository-host','AVAILABLE']
  ],
  'group.knowledge': [
    ['knowledge.prompts','Prompts','prompts','AVAILABLE'],
    ['knowledge.skills','Skills','skills','AVAILABLE'],
    ['knowledge.knowledge','Knowledge','knowledge','AVAILABLE']
  ],
  'group.system': [
    ['system.diagnostics','Diagnostics','diagnostics','AVAILABLE'],
    ['system.settings','Settings','settings','AVAILABLE'],
    ['system.about','About','about','AVAILABLE']
  ]
};
for (const [parent, rows] of Object.entries(expected)) {
  const actual = entries.filter(row => row.kind === 'page' && row.parent === parent).sort((a,b) => a.order-b.order);
  assert.strictEqual(actual.length, rows.length, `${parent} child count`);
  assert.deepStrictEqual(Array.from(actual, row => [row.id,row.label,row.page,row.readiness]), rows, `${parent} ordering/content`);
}
assert.strictEqual(entries.filter(row => row.kind === 'page').length, 19, 'full product navigation must have 19 pages');

const availableViews = ['dashboard','runner','plans','history','artifacts','intelligence','workforce','repository','titan-zero','browser','connections','mcp','repository-host','prompts','skills','knowledge','settings','diagnostics','about'];
const validation = registry.validate({ availableViews });
assert.strictEqual(validation.ok, true, JSON.stringify(validation.errors));
const resolved = context.CodeeNavigationReadiness.resolveAll(entries, {
  availableViews,
  capabilities:['browser.snapshot'],
  dependencies:{'browser.execution':true}
});
assert.strictEqual(resolved.find(row => row.id === 'workspace.runner').resolved.interactive, true);
assert.strictEqual(resolved.find(row => row.id === 'workspace.dashboard').resolved.state, 'AVAILABLE');
assert.strictEqual(resolved.find(row => row.id === 'workspace.dashboard').resolved.interactive, true);
assert.strictEqual(resolved.find(row => row.id === 'intelligence.browser').resolved.state, 'AVAILABLE');
assert.strictEqual(resolved.find(row => row.id === 'infrastructure.connections').resolved.state, 'AVAILABLE');
assert.strictEqual(resolved.find(row => row.id === 'infrastructure.connections').resolved.interactive, true);
assert.strictEqual(resolved.find(row => row.id === 'infrastructure.mcp').resolved.state, 'AVAILABLE');
assert.strictEqual(resolved.find(row => row.id === 'infrastructure.mcp').resolved.interactive, true);
console.log('Platform navigation remains canonical with all implemented workspace, intelligence and knowledge pages activated');
