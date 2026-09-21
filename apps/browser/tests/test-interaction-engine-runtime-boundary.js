const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const tsPath = path.join(root, 'src', 'interaction-engine', 'runtime-boundary.ts');
const jsPath = path.join(root, 'src', 'interaction-engine', 'generated', 'runtime-boundary.js');
const tsconfigPath = path.join(root, 'tsconfig.interaction.json');

assert.ok(fs.existsSync(tsPath), 'TypeScript runtime boundary source must exist');
assert.ok(fs.existsSync(jsPath), 'compiled browser runtime boundary must exist');
assert.ok(fs.existsSync(tsconfigPath), 'isolated Interaction Engine tsconfig must exist');

const source = fs.readFileSync(tsPath, 'utf8');
const generated = fs.readFileSync(jsPath, 'utf8');
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

for (const forbidden of ['node:', 'require(', 'process.', '__dirname', '__filename']) {
  assert.equal(source.includes(forbidden), false, `TypeScript production boundary must not use ${forbidden}`);
  assert.equal(generated.includes(forbidden), false, `compiled production boundary must not use ${forbidden}`);
}

assert.equal(tsconfig.compilerOptions.module, 'None');
assert.equal(tsconfig.compilerOptions.target, 'ES2022');
assert.equal(tsconfig.compilerOptions.strict, true);
assert.equal(tsconfig.compilerOptions.noEmitOnError, true);

const sandbox = { Object, Error };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(generated, sandbox, { filename: 'runtime-boundary.js' });

const runtime = sandbox.TitanInteractionEngineRuntime;
assert.ok(runtime, 'compiled boundary must register on globalThis');
assert.equal(runtime.schema, 'titan-code-interaction-runtime-boundary/v1');
assert.equal(runtime.runtime, 'embedded_browser');
assert.equal(runtime.offline_core, true);
assert.equal(runtime.provider_optional, true);
assert.equal(runtime.company_scope, 'company_id');
assert.deepEqual(
  JSON.parse(JSON.stringify(runtime.authority)),
  {
    plan_advance: false,
    plan_complete: false,
    canonical_promote: false,
    merge: false,
    verification: false,
    repository_write: false,
    shell: false,
    database_mutation: false
  }
);
assert.equal(Object.isFrozen(runtime), true);
assert.equal(Object.isFrozen(runtime.authority), true);

// Loading the exact same boundary twice must be idempotent.
vm.runInContext(generated, sandbox, { filename: 'runtime-boundary-second-load.js' });
assert.equal(sandbox.TitanInteractionEngineRuntime, runtime);

console.log('PASS interaction engine browser-safe TypeScript runtime boundary');
