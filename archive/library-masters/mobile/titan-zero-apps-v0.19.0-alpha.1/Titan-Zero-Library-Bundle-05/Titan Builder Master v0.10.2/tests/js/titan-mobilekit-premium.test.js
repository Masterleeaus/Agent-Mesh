const assert = require('assert');
const fs = require('fs');
const source = fs.readFileSync('resources/assets/js/titan-mobilekit-premium.js', 'utf8');
for (const token of ['localStorage', 'sessionStorage', 'serviceWorker.register', 'innerHTML', 'eval(', 'fetch(', 'XMLHttpRequest', 'userAgent']) {
    assert(!source.includes(token), `premium helper must not contain forbidden runtime token: ${token}`);
}
const api = require('../../resources/assets/js/titan-mobilekit-premium.js');
assert.strictEqual(api.version, '0.7.0');
assert.strictEqual(api.authority, 'presentation-only');
assert.strictEqual(typeof api.bindNetworkState, 'function');
assert.strictEqual(typeof api.setInstallCapability, 'function');
assert.strictEqual(typeof api.setDisclosure, 'function');
assert.strictEqual(typeof api.setPresentationMode, 'function');
assert.strictEqual(typeof api.setProgress, 'function');

const attrs = new Map();
const root = {
    dataset: {},
    setAttribute(name, value) { attrs.set(name, String(value)); },
    removeAttribute(name) { attrs.delete(name); },
    querySelector(selector) {
        if (selector === '[data-tpm-disclosure="faq"]') {
            return {
                dataset: {},
                setAttribute(name, value) { attrs.set(`disclosure:${name}`, String(value)); },
            };
        }
        if (selector === '[data-tpm-progress]') {
            return { style: { setProperty(name, value) { attrs.set(`progress:${name}`, value); } }, dataset: {} };
        }
        return null;
    },
    querySelectorAll() { return []; },
};
api.setDisclosure(root, 'faq', true);
assert.strictEqual(attrs.get('disclosure:aria-hidden'), 'false');
api.setPresentationMode(root, { theme: 'dark', direction: 'rtl' });
assert.strictEqual(root.dataset.tpmTheme, 'dark');
assert.strictEqual(attrs.get('dir'), 'rtl');
api.setProgress(root, 125);
assert.strictEqual(attrs.get('progress:--tpm-progress'), '100%');

console.log('Titan Mobilekit Premium runtime tests passed');
