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

// These two compatibility runtimes still provide bounded analysis/registration contracts.
// They may be removed only after their host adapters stop depending on them.
assert(worker.includes("'../repository/repository-coding-pack.js'"), 'Repository compatibility analysis runtime must remain until adapter convergence');
assert(worker.includes("'../titan-zero/titan-zero-developer-pack.js'"), 'Titan Zero compatibility analysis runtime must remain until adapter convergence');

assert(worker.includes("'browser-host-integration.js'"), 'Browser host integration must remain active');
assert(worker.includes("'titan-zero-host-integration.js'"), 'Titan Zero host integration must remain active');
assert(worker.includes("'workforce-host-integration.js'"), 'Workforce host integration must remain active');
assert(worker.includes("'../integration/titan-mcp-runtime.js'"), 'MCP runtime must remain active');

console.log('PASS: Browser Node startup excludes development-only prompt/skill/profile catalogues while retaining required runtime shims');
