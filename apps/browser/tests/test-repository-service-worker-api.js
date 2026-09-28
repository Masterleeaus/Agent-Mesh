const fs=require('fs'); const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
for(const needle of ["../repository/repository-policy.js","../integration/repository-host-adapter.js","repository-host-integration.js"]) assert(source.includes(needle),`missing worker import ${needle}`);
for(const removed of ["../repository/repository-coding-pack.js","../catalog/repository-prompts.js","../catalog/repository-skills.js","../catalog/repository-profiles.js"]) assert(!source.includes(removed),`developer-only repository runtime must not load at Browser Node startup: ${removed}`);
for(const action of ['GET_REPOSITORY_STATUS','UPDATE_REPOSITORY_SETTINGS','ANALYZE_REPOSITORY_SNAPSHOT','CALL_REPOSITORY_CAPABILITY']) assert(source.includes(`'${action}'`)||source.includes(`"${action}"`),`worker must handle hidden compatibility action ${action}`);
assert(/CodeeRepositoryHostIntegration/.test(source));
assert(!/CodeeRepository.*advancePlan/.test(source),'repository compatibility runtime must not gain plan advance authority');
console.log('Repository service-worker compatibility wiring OK without developer pack/catalogues');
