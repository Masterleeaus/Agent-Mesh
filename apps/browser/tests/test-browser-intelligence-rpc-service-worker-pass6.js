const assert=require('assert');
const fs=require('fs');
const worker=fs.readFileSync('src/lib/service-worker.js','utf8');
assert(worker.includes("'../intelligence/intelligence-rpc.js'"),'service worker must import intelligence RPC after offscreen runtime');
assert(/CodeeIntelligenceRpc\?\.handleChromeMessage|CodeeIntelligenceRpc\.handleChromeMessage/.test(worker),'service worker must route INTELLIGENCE_RPC through CodeeIntelligenceRpc');
const rpc=fs.readFileSync('src/intelligence/intelligence-rpc.js','utf8');
assert(!/setInterval\s*\(/.test(rpc),'RPC transport must not introduce keepalive timers');
assert(rpc.includes('session does not own request'),'RPC cancellation must enforce session ownership');
console.log('Browser intelligence pass 6 service-worker wiring');
