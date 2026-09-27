const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const sw = fs.readFileSync(path.join(root, 'src/lib/service-worker.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src/sidebar/sidebar.js'), 'utf8');
function ok(v,m){ if(!v){ console.error('FAIL:',m); process.exit(1); } }
ok(sw.includes("message.action === 'GET_NEXT_RUNNERS'"), 'bulk Next Runner status action missing');
ok(sw.includes('async function getAllNextRunnerStatuses()'), 'bulk active Next Runner reader missing');
ok(sw.includes("action:'NEXT_RUNNER_UPDATED'"), 'Next Runner update broadcast missing');
ok(ui.includes('let activeNextRunners = new Map()'), 'sidebar active Next Runner registry missing');
ok(ui.includes('activePlans.size === 0 && activeNextRunners.size === 0'), 'Active Plans does not account for timed Next plans');
ok(ui.includes('TIMED NEXT PLAN'), 'Active Plans timed Next plan label missing');
ok(ui.includes('adoptNextRunnerStatus({ ...response, tabId })'), 'Start/stop response is not adopted into Active Plans');
ok(ui.includes("message.action === 'NEXT_RUNNER_UPDATED'"), 'live Next Runner update listener missing');
ok(ui.includes("chrome.runtime.sendMessage({ action:'GET_NEXT_RUNNERS' })"), 'saved active Next runners not loaded on sidebar startup');
ok(ui.includes('Number(plan.activeCount || 0) + activeNextRunners.size'), 'dashboard active count excludes Next Runner plans');
console.log('PASS next runner appears in Active Plans');

// Timed Next progression must be persisted like plan-runner passes.
ok(sw.includes('sentCount: Number(item.sentCount) || 0'), 'Next Runner sentCount missing from status');
ok(sw.includes('sentCount: (Number(previous.sentCount) || 0) + (response?.ok ? 1 : 0)'), 'verified Next send does not increment sentCount');
ok(sw.includes('deferredCount: (Number(previous.deferredCount) || 0) + (deferred ? 1 : 0)'), 'safe deferred Next attempts are not counted separately');
ok(sw.includes('failedCount: (Number(previous.failedCount) || 0) + ((!response?.ok && !deferred) ? 1 : 0)'), 'hard failed Next attempts must exclude safe deferrals');
ok(sw.includes('sentCount:0, deferredCount:0, failedCount:0, attemptCount:0'), 'new Next Runner session does not reset progression counters');
ok(ui.includes('Next ${Number(status?.sentCount) || 0} · every'), 'Active Plans does not display Next progression count');
ok(ui.includes('Next count: ${sent}'), 'Next Runner status does not display verified progression count');
