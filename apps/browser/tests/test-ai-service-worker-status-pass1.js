const assert=require('assert'),fs=require('fs');
const worker=fs.readFileSync('src/lib/service-worker.js','utf8');
for(const ref of ['../ai/ai-audit-ledger.js','../ai/ai-request-contract.js','../ai/ai-response-contract.js','../ai/provider-contract.js','../ai/ai-provider-registry.js','../ai/model-registry.js','../ai/provider-gateway.js','onboard-ai-host-integration.js']) assert(worker.includes(ref),`worker must import ${ref}`);
assert(worker.includes("message.action === 'GET_AI_GATEWAY_STATUS'"),'worker must expose GET_AI_GATEWAY_STATUS');
const gatewayPos=worker.indexOf("../ai/provider-gateway.js"); const workforcePos=worker.indexOf("../workforce/task-classifier.js"); assert(gatewayPos>=0&&workforcePos>gatewayPos,'AI gateway must load before Workforce');
console.log('AI service worker status wiring pass');
