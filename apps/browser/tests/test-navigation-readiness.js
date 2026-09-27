const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const context = vm.createContext({ console, globalThis: {} });
context.globalThis = context;
for (const file of ['src/lib/navigation-registry.js','src/lib/navigation-readiness.js']) {
  vm.runInContext(fs.readFileSync(file,'utf8'), context, { filename:file });
}
context.CodeeNavigationRegistry.clear();
context.CodeeNavigationRegistry.installDefaults();
const readiness = context.CodeeNavigationReadiness;
assert(readiness, 'CodeeNavigationReadiness must exist');

const runner = readiness.resolve(context.CodeeNavigationRegistry.get('workspace.runner'), { availableViews:['runner'] });
assert.strictEqual(runner.state, 'AVAILABLE');
assert.strictEqual(runner.interactive, true);

const browser = readiness.resolve(context.CodeeNavigationRegistry.get('intelligence.browser'), {
  availableViews:['browser'], capabilities:['browser.snapshot'], dependencies:{'browser.execution':true}
});
assert.strictEqual(browser.state, 'AVAILABLE');
assert.strictEqual(browser.interactive, true);

const missing = readiness.resolve({
  id:'x', kind:'page', page:'x', label:'X', readiness:'AVAILABLE', dependencyRequirements:['repo.host']
}, { availableViews:['x'], dependencies:{'repo.host':false} });
assert.strictEqual(missing.state, 'DEPENDENCY_MISSING');
assert.strictEqual(missing.interactive, false);

const disabled = readiness.resolve({
  id:'y', kind:'page', page:'y', label:'Y', readiness:'AVAILABLE', featureFlag:'feature.y'
}, { availableViews:['y'], featureFlags:{'feature.y':false} });
assert.strictEqual(disabled.state, 'DISABLED');

const beta = readiness.resolve({ id:'z', kind:'page', page:'z', label:'Z', readiness:'BETA' }, { availableViews:['z'] });
assert.strictEqual(beta.state, 'BETA');
assert.strictEqual(beta.interactive, true);
console.log('Navigation readiness states resolve fail-closed');
