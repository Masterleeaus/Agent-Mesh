const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/sidebar/sidebar.js', 'utf8');
const html = fs.readFileSync('src/sidebar/sidebar.html', 'utf8');

const context = {
  console: { log() {}, error() {}, warn() {} },
  document: { addEventListener() {} },
  chrome: { runtime: { onMessage: { addListener() {} } } },
  Map,
  Promise,
  URL
};

vm.runInNewContext(source, context);

assert.strictEqual(typeof context.getProviderName, 'function',
  'sidebar must expose provider detection for supported conversation tabs');
assert.strictEqual(typeof context.getConversationTitle, 'function',
  'sidebar must expose conversation-title cleanup');
assert.strictEqual(typeof context.getDefaultTargetTabId, 'function',
  'sidebar must expose current-tab target selection');
assert.strictEqual(typeof context.parsePlanText, 'function',
  'sidebar must expose Markdown-aware plan parsing');
assert.strictEqual(typeof context.isSupportedPlanFile, 'function',
  'sidebar must expose local plan-file validation');

assert.strictEqual(
  context.getProviderName({ url: 'https://chatgpt.com/c/abc' }),
  'ChatGPT'
);
assert.strictEqual(
  context.getProviderName({ url: 'https://claude.ai/chat/abc' }),
  'Claude'
);

assert.strictEqual(
  context.getConversationTitle({ title: 'Chrome Extension Deep Scan', url: 'https://chatgpt.com/c/abc' }),
  'Chrome Extension Deep Scan'
);
assert.strictEqual(
  context.getConversationTitle({ title: 'Titan architecture review - Claude', url: 'https://claude.ai/chat/abc' }),
  'Titan architecture review'
);
assert.strictEqual(
  context.getConversationTitle({ title: 'ChatGPT', url: 'https://chatgpt.com/' }),
  'ChatGPT conversation'
);

const tabs = [
  { id: 11, title: 'Other chat', url: 'https://chatgpt.com/c/other' },
  { id: 22, title: 'Current chat', url: 'https://claude.ai/chat/current' }
];
assert.strictEqual(context.getDefaultTargetTabId(tabs, tabs[1]), 22,
  'active supported conversation must be the default target');
assert.strictEqual(context.getDefaultTargetTabId(tabs, { id: 99, url: 'https://example.com/' }), 11,
  'when current tab is unsupported, first open supported conversation is the fallback');

const headingPlan = Array.from(context.parsePlanText(`# Upgrade plan\n\n### Step 1: Inspect current behavior\n- scan existing files\n### Step 2: Fix target selection\n- preserve current behavior`));
assert.deepStrictEqual(headingPlan.map(step => step.text), [
  'Inspect current behavior\n- scan existing files',
  'Fix target selection\n- preserve current behavior'
], 'Step headings must win over nested Markdown detail bullets while preserving their section bodies');

const detailedPlan = Array.from(context.parsePlanText(`### Task 1: Inspect current behavior\n**Files:** sidebar.js\n- Check target discovery\n- Check labels\n\n### Task 2: Implement the fix\n- Preserve the working sidebar\n- Add tests`));
assert.strictEqual(detailedPlan.length, 2, 'Task/Step Markdown sections must remain whole plan steps');
assert(detailedPlan[0].text.includes('Inspect current behavior'), 'section title must be preserved');
assert(detailedPlan[0].text.includes('**Files:** sidebar.js'), 'section body must be preserved');
assert(detailedPlan[0].text.includes('- Check target discovery'), 'nested section bullets must remain inside their parent step');
assert(detailedPlan[1].text.includes('- Add tests'), 'second section body must be preserved');

const numberedPlan = Array.from(context.parsePlanText(`1. Fix target selection\n2) Add Markdown import`));
assert.deepStrictEqual(numberedPlan.map(step => step.text), [
  'Fix target selection',
  'Add Markdown import'
]);

const bulletPlan = Array.from(context.parsePlanText(`- [ ] Add file picker\n* Verify packaging`));
assert.deepStrictEqual(bulletPlan.map(step => step.text), [
  'Add file picker',
  'Verify packaging'
]);

assert.strictEqual(context.isSupportedPlanFile({ name: 'PLAN.md', size: 1024, type: 'text/markdown' }), true);
assert.strictEqual(context.isSupportedPlanFile({ name: 'plan.txt', size: 1024, type: 'text/plain' }), true);
assert.strictEqual(context.isSupportedPlanFile({ name: 'plan.pdf', size: 1024, type: 'application/pdf' }), false);
assert.strictEqual(context.isSupportedPlanFile({ name: 'huge.md', size: (1024 * 1024) + 1, type: 'text/markdown' }), false);

for (const id of ['plan-file-input', 'plan-file-drop', 'plan-file-name']) {
  assert(new RegExp(`id=["']${id}["']`).test(html), `sidebar markup must include #${id}`);
}
assert(/accept=["'][^"']*\.md[^"']*\.txt/i.test(html),
  'file picker must visibly accept both .md and .txt plans');

console.log('sidebar targeting and plan import OK');
