'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sw = fs.readFileSync(path.join(root, 'src/lib/service-worker.js'), 'utf8');

function ok(condition, message) {
  if (!condition) throw new Error(message);
}

const start = sw.indexOf('async function sendStandaloneNext(tabId)');
const end = sw.indexOf('async function scheduleNextRunnerAlarm', start);
ok(start >= 0 && end > start, 'sendStandaloneNext() not found');
const fn = sw.slice(start, end);

ok(!fn.includes("? false : Boolean(previous.enabled)"), 'send failure must not disable an active timed Next plan');
ok(!fn.includes("nextDueAt: response?.reason === 'target-conversation-mismatch'"), 'send failure must not clear the timed plan nextDueAt');
ok(fn.includes('enabled: Boolean(previous.enabled)'), 'send result must preserve enabled state until explicit Stop');
ok(fn.includes('failedCount:'), 'failed/skipped attempts must still be counted');
ok(fn.includes('lastResult:'), 'failure reason must remain visible for diagnostics');

console.log('next runner send failures retain active plan OK');
