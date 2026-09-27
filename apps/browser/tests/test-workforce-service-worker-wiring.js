const fs=require('fs'),assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
for(const needle of ['../workforce/task-classifier.js','../managers/manager-catalog.js','../integration/workforce-receiver-adapter.js','workforce-host-integration.js']) assert(source.includes(needle),`missing worker import ${needle}`);
for(const action of ['GET_WORKFORCE_STATUS','UPDATE_WORKFORCE_SETTINGS','PREPARE_WORKFORCE_PREFLIGHT','CREATE_WORKFORCE_PLAN_DRAFT','CALL_WORKFORCE_CAPABILITY','EXECUTE_WORKFORCE_TOOL_REQUEST','REQUEST_WORKFORCE_GOVERNED_MUTATION']) assert(source.includes(`'${action}'`),`missing action ${action}`);
assert(source.includes('attachWorkforceContext(basePrompt, planState.workforceContext)'));
assert(source.includes('prepareWorkforceForPlanState(planState)'));
assert(!/workforce[^\n]{0,80}(plan\.advance|advancePlan\s*:\s*true)/i.test(source),'workforce must not gain plan advance authority');
console.log('Workforce service-worker wiring OK');
