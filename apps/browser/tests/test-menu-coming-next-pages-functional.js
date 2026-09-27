const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const registry = fs.readFileSync(path.join(root, 'src/lib/navigation-registry.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'src/sidebar/sidebar.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/sidebar/sidebar.js'), 'utf8');

const pages = [
  ['zero.outcomes','history'],
  ['zero.evidence','artifacts'],
  ['workforce.intelligence','intelligence'],
  ['workforce.control','workforce'],
  ['systems.knowledge','knowledge'],
  ['systems.connections','connections'],
  ['systems.mcp','mcp'],
  ['workforce.browser','browser'],
  ['node.diagnostics','diagnostics'],
  ['node.settings','settings'],
  ['node.about','about']
];

for (const [id, page] of pages) {
  const entry = new RegExp(`id: '${id.replace('.', '\\.')}'[^\\n]+page: '${page}'[^\\n]+readiness: 'AVAILABLE'`);
  assert(entry.test(registry), `${id} should be AVAILABLE`);
  assert(html.includes(`data-page="${page}"`), `${page} page scaffold missing`);
}

for (const retired of ['intelligence.repository','intelligence.titan','workspace.repository-host','workspace.prompts','workspace.skills']) {
  assert(!registry.includes(`id: '${retired}'`), `${retired} must not remain a primary Browser Node navigation item`);
}
assert(js.includes('loadWorkspacePage'), 'sidebar page loader wiring missing');
console.log('PASS Browser Node operational navigation pages are functional and development-only pages are demoted');
