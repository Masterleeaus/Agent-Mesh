
const fs=require('fs'),assert=require('assert');
const sw=fs.readFileSync('src/lib/service-worker.js','utf8');
assert(sw.includes("'production-plan-preflight.js'"),'worker must load production preflight runtime');
assert(/async function collectProductionPlanEvidence/.test(sw),'worker must collect live preflight evidence');
assert(/async function evaluateProductionPlanPreflight/.test(sw),'worker must evaluate canonical preflight');
assert(/planState\.productionPreflight/.test(sw),'plan state must persist production preflight');
assert(/productionPreflight\?\.status === 'BLOCKED'/.test(sw),'start path must enforce blockers');
assert(sw.includes("message.action === 'RUN_PRODUCTION_PLAN_PREFLIGHT'"),'worker must expose explicit preflight action');
const side=fs.readFileSync('src/sidebar/sidebar.js','utf8'); const html=fs.readFileSync('src/sidebar/sidebar.html','utf8');
assert(html.includes('Production Plan Preflight'),'Runner must expose production preflight');
assert(side.includes('RUN_PRODUCTION_PLAN_PREFLIGHT'),'Runner must invoke worker preflight');
console.log('PASS: production plan preflight integration wiring');
