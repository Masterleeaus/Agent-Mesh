import fs from 'node:fs';
import assert from 'node:assert/strict';

const sidePanel = fs.readFileSync('sidePanel.html','utf8');
const chatTab = fs.readFileSync('chatTab.html','utf8');

// Titan shell must not boot the 28 MB retained donor content runtime eagerly.
assert.doesNotMatch(
  sidePanel,
  /<script[^>]+src=["']\.\/titan-zero-chat-content\.compat\.js["'][^>]*><\/script>/i,
  'Titan side-panel startup must not eagerly execute the retained donor content runtime'
);

// The rich donor-derived AI workspace remains preserved and loads only when Titan enters AI.
assert.match(
  sidePanel,
  /<iframe[^>]+id=["']titan-ai-frame["'][^>]+data-src=["']chatTab\.html["']/i,
  'Titan AI workspace must remain lazy-loaded behind the Titan shell'
);
assert.match(
  sidePanel,
  /<div[^>]+id=["']root["'][^>]+hidden/i,
  'compatibility root must remain hidden on Titan shell startup'
);
assert.match(
  chatTab,
  /<script[^>]+src=["']\.\/titan-zero-chat-content\.compat\.js["'][^>]*><\/script>/i,
  'explicit Titan AI workspace must retain the retained Titan compatibility content runtime'
);

console.log('PASS side-panel donor runtime isolation');
