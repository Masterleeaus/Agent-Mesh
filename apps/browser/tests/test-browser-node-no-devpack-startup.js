const fs = require('fs');
const path = require('path');
const assert = require('assert');

const worker = fs.readFileSync(path.resolve(__dirname, '../src/lib/service-worker.js'), 'utf8');

const forbiddenStartupImports = [
  "../catalog/repository-prompts.js",
  "../catalog/repository-skills.js",
  "../catalog/repository-profiles.js",
  "../repository/repository-coding-pack.js",
  "../titan-zero/titan-zero-development-prompts.js",
  "../titan-zero/titan-zero-development-skills.js",
  "../titan-zero/titan-zero-development-profiles.js",
  "../titan-zero/titan-zero-developer-pack.js"
];

for (const modulePath of forbiddenStartupImports) {
  assert(!worker.includes(`'${modulePath}'`), `Browser Node must not eagerly load development-only module: ${modulePath}`);
}

assert(worker.includes("'browser-host-integration.js'"), 'Browser host integration must remain active');
assert(worker.includes("'titan-zero-host-integration.js'"), 'Titan Zero host integration must remain active');
assert(worker.includes("'workforce-host-integration.js'"), 'Workforce host integration must remain active');
assert(worker.includes("'../integration/titan-mcp-runtime.js'"), 'MCP runtime must remain active');

console.log('PASS: Browser Node startup excludes development-only prompt/skill/coding packs');
