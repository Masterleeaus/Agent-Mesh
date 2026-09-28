const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const worker = fs.readFileSync(path.join(root, 'src/lib/service-worker.js'), 'utf8');
const gateway = fs.readFileSync(path.join(root, 'src/workforce/titan-workforce-gateway.js'), 'utf8');
const contract = fs.readFileSync(path.join(root, 'src/integration/workforce-host-contract.js'), 'utf8');

const imports = [...worker.matchAll(/['"]([^'"]+\.js)['"]/g)].map(match => match[1]);
const forbiddenImports = /(?:\.\.\/repository\/|repository-host|mcp-inspector|titan-bridge-client)/;
assert.equal(imports.some(importPath => forbiddenImports.test(importPath)), false, 'private repository/developer bridge must not be reachable from the production worker');
assert.equal(\/source_surface:\s*['\"]titan_code['\"]|target_domain:\s*['\"]deployment_workforce['\"]|client:\s*['\"]titan-code['\"]|titan-code:/.test(gateway + contract), false, 'legacy private developer identity must not be exposed by the production workforce boundary');
assert.match(gateway, /source_surface:\s*'titan_browser_node'/);
assert.match(gateway, /target_domain:\s*'hosted_workforce'/);
console.log('production Browser Node reachability boundary: PASS');
