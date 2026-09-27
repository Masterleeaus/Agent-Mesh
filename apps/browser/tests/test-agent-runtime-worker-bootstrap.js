const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
assert.strictEqual(manifest.background?.service_worker, 'src/lib/service-worker.js');
assert.strictEqual(manifest.background?.type, 'module', 'canonical MV3 worker must support the imported ESM runtime');

function readRaw(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const stat = fs.fstatSync(fd);
    const buf = Buffer.alloc(stat.size);
    fs.readSync(fd, buf, 0, stat.size, 0);
    return buf.toString('utf8');
  } finally { fs.closeSync(fd); }
}

const worker = readRaw(path.join(root, 'src/lib/service-worker.js'));
assert(worker.includes("import '../browser/agent-runtime/background.js';"), 'canonical worker must bootstrap mature browser runtime');
assert(!worker.includes('PRIVATE TITAN CODE DEVELOPMENT-ONLY'), 'Browser Node worker must not identify as private Titan Code');
assert(!worker.includes('NOT A TITAN ZERO RUNTIME DEPENDENCY'), 'Browser Node worker must identify as a Titan Zero runtime surface');
assert(worker.includes('CodeeIntelligenceRpc'), 'intelligence runtime must remain available');
assert(worker.includes('CodeeMcpRuntime'), 'MCP runtime must remain available');

const runtime = fs.readFileSync(path.join(root, 'src/browser/agent-runtime/background.js'), 'utf8');
for (const required of [
  'createSwLoopRuntime',
  'createActionJournal',
  'createSessionStore',
  'createTabGroupManager',
  'createTabController',
  'createSwLoopRouter'
]) assert(runtime.includes(required), `browser runtime missing ${required}`);

console.log('PASS Titan Zero Browser Node module-worker bootstrap');
