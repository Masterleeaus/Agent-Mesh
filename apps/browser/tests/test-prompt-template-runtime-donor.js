'use strict';
const assert = require('node:assert/strict');
const runtime = require('../src/intelligence/prompt-template-runtime');
assert.deepEqual(runtime.parseTemplateVariables('Fix ${file:src/a.js} for ${issue}.'), [
  { name: 'file', defaultValue: 'src/a.js' },
  { name: 'issue', defaultValue: '' },
]);
assert.equal(runtime.applyTemplateVariables('Fix ${file:x} / ${issue:unknown}', { file: 'src/b.js', issue: 'bug' }), 'Fix src/b.js / bug');
assert.equal(runtime.applyTemplateVariables('${__proto__:blocked}', Object.create({ __proto__: 'x' })), '');
assert.equal(runtime.capability().canonical_authority, false);
console.log('PASS prompt-template-runtime donor integration');
