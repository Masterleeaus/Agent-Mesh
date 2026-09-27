const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const registry = fs.readFileSync(path.join(root, 'src/lib/navigation-registry.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'src/sidebar/sidebar.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/sidebar/sidebar.js'), 'utf8');

const pages = [
  ['workspace.history','history'],
  ['workspace.artifacts','artifacts'],
  ['intelligence.brain','intelligence'],
  ['intelligence.workforce','workforce'],
  ['intelligence.repository','repository'],
  ['intelligence.titan','titan-zero'],
  ['knowledge.knowledge','knowledge']
];

for (const [id, page] of pages) {
  const entry = new RegExp(`id: '${id.replace('.', '\\.')}'[^\\n]+page: '${page}'[^\\n]+readiness: 'AVAILABLE'`);
  assert(entry.test(registry), `${id} should be AVAILABLE`);
  assert(html.includes(`data-page="${page}"`), `${page} page scaffold missing`);
  assert(js.includes(`loadWorkspacePage('${page}')`) || js.includes(`case '${page}'`), `${page} loader wiring missing`);
}

assert(!/id: '(workspace\.history|workspace\.artifacts|intelligence\.brain|intelligence\.workforce|intelligence\.repository|intelligence\.titan|knowledge\.knowledge)'[^\n]+readiness: 'COMING_NEXT'/.test(registry), 'No formerly Coming Next page may remain COMING_NEXT');
console.log('menu coming-next pages functional wiring OK');
