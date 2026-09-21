const fs=require('fs');
const cs=fs.readFileSync('src/content-script.js','utf8');
const sw=fs.readFileSync('src/lib/service-worker.js','utf8');
const ui=fs.readFileSync('src/sidebar/sidebar.js','utf8');
function ok(v,m){if(!v){console.error('FAIL',m);process.exit(1)}}
ok(cs.includes('countRenderedNextMessages()'), 'baseline rendered next count missing');
ok(cs.includes('composerCleared && (newRenderedNext || nextCountAdvanced)'), 'nudge success does not require composer clear plus rendered user message');
ok(!cs.includes("if (liveInput && readComposerText(liveInput) === '') return true;"), 'empty composer still treated as authoritative nudge success');
ok(sw.includes('initialPending:!immediate?.sent'), 'runner does not report deferred initial next while remaining active');
ok(sw.includes("sentCount: (Number(previous.sentCount) || 0) + (response?.ok ? 1 : 0)"), 'verified send counter missing');
ok(sw.includes("deferredCount: (Number(previous.deferredCount) || 0) + (deferred ? 1 : 0)"), 'safe deferral counter missing');
ok(sw.includes("failedCount: (Number(previous.failedCount) || 0) + ((!response?.ok && !deferred) ? 1 : 0)"), 'hard failure counter must exclude safe deferrals');
ok(sw.includes("eventType = response?.ok ? 'next-runner-sent' : (deferred ? 'next-runner-deferred' : 'next-runner-failed')"), 'diagnostics must distinguish sent/deferred/failed');
ok(ui.includes('safely deferred'), 'UI must label safe deferrals separately from hard failures');
ok(ui.includes('Next ${Number(status?.sentCount) || 0} · every'), 'Active Plans next progression label missing');
console.log('PASS next runner verified send count');
