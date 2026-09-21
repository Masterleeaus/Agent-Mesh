const fs=require('fs'); const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
assert(/importScripts\s*\(/.test(source),'worker must load local Titan Zero capability runtime');
for(const action of ['GET_CAPABILITY_REGISTRY','ANALYZE_TITAN_ZERO_SNAPSHOT','GET_TITAN_ZERO_STATUS','UPDATE_TITAN_ZERO_SETTINGS']) {
 assert(source.includes(`'${action}'`) || source.includes(`\"${action}\"`),`worker must handle ${action}`);
}
assert(/CodeeTitanZeroHostIntegration/.test(source),'worker must use Titan Zero host integration adapter');
assert(!/CodeeTitanZero.*advancePlan/.test(source),'donor must not gain plan advancement authority');
console.log('Titan Zero service-worker receiver API wiring OK');
