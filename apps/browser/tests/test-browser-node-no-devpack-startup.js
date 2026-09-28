const fs = require('fs');
const path = require('path');
const assert = require('assert');

const worker = fs.readFileSync(path.resolve(__dirname, '../src/lib/service-worker.js'), 'utf8');

const forbiddenStartupImports = [
  "../catalog/repository-prompts.js",
  "../catalog/repository-skills.js",
  "../catalog/repository-profiles.js",
  "../titan-zero/titan-zero-development-prompts.js",
  "../titan-zero/titan-zero-development-skills.js",
  "../titan-zero/titan-zero-development-profiles.js"
];

for (const modulePath of forbiddenStartupImports) {
  assert(!worker.includes(`'${modulePath}'`), `Browser Node must not eagerly load development-only catalogue: ${modulePath}`);
}

// Repository host integration is now self-sufficient and the old coding mega-pack must stay out of startup.
assert(!worker.includes("'../repository/repository-coding-pack.js'"), 'Repository coding compatibility pack must not load at Browser Node startup');
assert(!worker.includes("'../integration/receiver-adapter.js'"), 'Repository receiver adapter must not load after host integration convergence');
// Titan Zero developer pack is still a temporary compatibility shim until its host adapter converges in the next pass.
assert(worker.includes("'../titan-zero/titan-zero-developer-pack.js'"), 'Titan Zero compatibility analysis runtime must remain until adapter convergence');

assert(worker.includes("'browser-host-integration.js'"), 'Browser host integration must remain active');
assert(worker.includes("'titan-zero-host-integration.js'"), 'Titan Zero host integration must remain active');
assert(worker.includes("'workforce-host-integration.js'"), 'Workforce host integration must remain active');
assert(worker.includes("'../integration/titan-mcp-runtime.js'"), 'MCP runtime must remain active');

console.log('PASS: Browser Node startup excludes development-only prompt/skill/profile catalogues while retaining required runtime shims');
