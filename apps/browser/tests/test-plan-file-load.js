const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/sidebar/sidebar.js', 'utf8');
const elements = {
  'plan-input': { value: '' },
  'plan-file-name': { textContent: '', className: '' },
  'plan-file-input': { value: '' },
  'message': { textContent: '' }
};

const context = {
  console: { log() {}, error() {}, warn() {} },
  document: {
    addEventListener() {},
    getElementById(id) { return elements[id] || null; }
  },
  chrome: { runtime: { onMessage: { addListener() {} } } },
  Map,
  Promise,
  URL
};

vm.runInNewContext(source, context);

(async () => {
  const markdown = '# Plan\n\n1. Inspect\n2. Implement';
  const loaded = await context.loadPlanFile({
    name: 'PLAN.md',
    size: Buffer.byteLength(markdown),
    type: 'text/markdown',
    async text() { return markdown; }
  });

  assert.strictEqual(loaded, true, 'valid Markdown plan must load');
  assert.strictEqual(elements['plan-input'].value, markdown,
    'loaded Markdown must be copied intact into the editable plan textarea');
  assert(elements['plan-file-name'].textContent.includes('PLAN.md'),
    'loaded filename must be shown to the user');
  assert(elements['message'].textContent.includes('Review or edit'),
    'sidebar must tell the user the imported plan can be reviewed/edited before start');

  let invalidRead = false;
  const rejected = await context.loadPlanFile({
    name: 'PLAN.pdf',
    size: 100,
    type: 'application/pdf',
    async text() { invalidRead = true; return 'bad'; }
  });

  assert.strictEqual(rejected, false, 'unsupported files must be rejected');
  assert.strictEqual(invalidRead, false, 'unsupported files must not be read');

  console.log('local plan-file load OK');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
