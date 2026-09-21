const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('src/sidebar/sidebar.js', 'utf8');

assert(/dispatchStatus\s*:\s*['"]pending_send['"]/.test(source),
  'new plans must begin in pending_send state before any ZIP can advance them');
assert(/knownVersions\s*:\s*\[\s*\]/.test(source),
  'new plans must track pre-existing conversation ZIPs separately from plan output versions');
assert(/action\s*:\s*['"]START_PLAN['"]/.test(source),
  'sidebar must ask the service worker to transactionally start/retry the plan');

const startPlanMatch = source.match(/(?:async\s+)?function\s+startPlan\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/);
assert(startPlanMatch, 'startPlan function must exist');
assert(!/chrome\.tabs\.sendMessage/.test(startPlanMatch[1]),
  'sidebar must not bypass the delivery-safe service-worker state machine');

console.log('sidebar transactional start wiring OK');
