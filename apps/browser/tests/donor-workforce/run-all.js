const {spawnSync}=require('child_process'),path=require('path');
const files=['workforce-core.test.js','authority.test.js','evidence-handoff.test.js','ai-assistance.test.js','catalog.test.js','integration.test.js','governed-requests.test.js'];
let passed=0;for(const f of files){const r=spawnSync(process.execPath,[path.join(__dirname,f)],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);passed++;}
console.log(`${passed}/${files.length} test files PASS`);
