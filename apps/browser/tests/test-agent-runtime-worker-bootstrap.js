const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
assert.strictEqual(manifest.background?.service_worker, 'src/lib/service-worker.js');
assert.strictEqual(manifest.background?.type, 'module', 'canonical MV3 worker must support the imported ESM runtime');

const worker = fs.readFileSync(path.join(root, 'src/lib/service-worker.js'), 'utf8');
assert(worker.includes("import '../browser/agent-runtime/background.js';"), 'canonical worker must bootstrap mature browser runtime');
assert(worker.includes('PRIVATE TITAN CODE DEVELOPMENT-ONLY'));
assert(worker.includes('NOT A TITAN ZERO RUNTIME DEPENDENCY'));
assert(worker.includes('CodeeIntelligenceRpc'), 'Titan Code intelligence authority must remain in canonical worker');
assert(worker.includes('CodeeMcpRuntime'), 'Titan Code MCP authority must remain in canonical worker');

const runtime = fs.readFileSync(path.join(root, 'src/browser/agent-runtime/background.js'), 'utf8');
for (const required of [
  'createSwLoopRuntime',
  'createActionJournal',
  'createSessionStore',
  'createTabGroupManager',
  'createTabController',
  'createSwLoopRouter'
]) assert(runtime.includes(required), `browser runtime missing ${required}`);

console.log('Titan Code module-worker bootstrap preserves canonical authorities and activates mature browser runtime');
