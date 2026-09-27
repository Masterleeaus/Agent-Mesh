const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('src/lib/service-worker.js', 'utf8');
assert(
  source.includes('If this step cannot complete'),
  'signature contract must tell the worker how to report non-completed outcomes'
);
assert(
  source.includes('STATUS: partial|failed|blocked') || source.includes('STATUS to partial, failed, or blocked'),
  'signature contract must name supported non-completed STATUS values'
);
assert(
  source.includes('NEXT_ACTION to retry, hold, or needs_user'),
  'signature contract must name supported non-completed NEXT_ACTION values'
);
console.log('signature contract documents non-completed outcomes OK');
