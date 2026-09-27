const fs=require('fs');
const sw=fs.readFileSync('src/lib/service-worker.js','utf8');
const ui=fs.readFileSync('src/sidebar/sidebar.js','utf8');
function ok(v,m){if(!v){console.error('FAIL',m);process.exit(1)}}
ok(sw.includes('async function resolveNextRunnerTarget'), 'exact target resolver missing');
ok(sw.includes("queryTabs({ url:['*://chatgpt.com/*', '*://claude.ai/*'] })"), 'resolver must scan supported provider tabs');
ok(sw.includes('getStructuredConversationIdentity(canonicalUrl) === expectedIdentity'), 'background reopen must require exact stable identity');
ok(sw.includes("chrome.tabs.create({ url:canonicalUrl, active:false })"), 'target reopen must stay in background');
ok(sw.includes('withRunnableConversationTab(resolvedTabId'), 'resolved target must use existing safe wake/restore transport');
ok(sw.includes("composer-not-empty|provider-busy"), 'safe deferral classifier must cover draft and busy-provider states');
ok(sw.includes("lastOutcome: diagnostic.outcome"), 'structured last outcome missing');
ok(sw.includes("lastDiagnostic: diagnostic"), 'structured last diagnostic missing');
ok(ui.includes("response.lastDiagnostic?.reason"), 'UI must consume structured diagnostics');
ok(ui.includes("response.lastDiagnostic?.outcome"), 'UI must show structured outcome');
console.log('PASS next runner target recovery + safe deferral diagnostics');
