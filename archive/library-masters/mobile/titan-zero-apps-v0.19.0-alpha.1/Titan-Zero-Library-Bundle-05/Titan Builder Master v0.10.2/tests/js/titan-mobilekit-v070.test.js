const assert = require('assert');
const ui = require('../../resources/assets/js/titan-generative-ui.js');
const premium = require('../../resources/assets/js/titan-mobilekit-premium.js');
assert.strictEqual(premium.version, '0.7.0', 'premium helper version must be 0.7.0');
const expected = ['auth-panel','profile-hero','profile-stat-grid','chat-thread','chat-message','chat-composer','invoice-header','invoice-party','invoice-line-items','invoice-total','cart-item','product-detail','rating-summary','article-header','article-body','social-links','system-state'];
assert.strictEqual(Object.keys(ui.components).length, 125, 'runtime must expose 71 core + 54 premium components');
for (const type of expected) {
  assert.strictEqual(typeof ui.components[type], 'function', `${type} renderer missing`);
  const result = ui.validateSpecClient({ root: 'root', elements: { root: { type, props: {} } } });
  assert.strictEqual(result.valid, true, `${type} must be client-valid`);
}
console.log(JSON.stringify({ passed: expected.length, components: Object.keys(ui.components).length }));
