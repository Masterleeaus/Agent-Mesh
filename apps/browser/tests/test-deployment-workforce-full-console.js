const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'src/sidebar/sidebar.html'),'utf8');
for(const id of ['workforce-run-advisory','workforce-preflight-btn','workforce-draft-btn']) assert(html.includes(`id="${id}"`),`existing control lost: ${id}`);
for(const id of ['workforce-gateway-badge','workforce-deployment-mission-select','workforce-deployment-refresh','workforce-deployment-summary','workforce-deployment-team','workforce-deployment-evidence','workforce-deployment-readiness','workforce-deployment-handover','workforce-deployment-receipts']) assert(html.includes(`id="${id}"`),`missing expanded workforce UI ${id}`);
const sw=fs.readFileSync(path.join(root,'src/lib/service-worker.js'),'utf8');
for(const action of ['GET_DEPLOYMENT_WORKFORCE_CONSOLE','REFRESH_DEPLOYMENT_WORKFORCE','SUBMIT_DEPLOYMENT_WORKFORCE_REQUEST','GET_DEPLOYMENT_WORKFORCE_RECEIPTS']) assert(sw.includes(action),`missing service action ${action}`);
assert(sw.includes('../workforce/titan-workforce-gateway.js'));
assert(sw.includes('../workforce/deployment-console-store.js'));
function load(file,ctx){vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});}
const ctx={console,Date,Math,crypto:require('crypto').webcrypto,globalThis:null};ctx.globalThis=ctx;
load('src/workforce/titan-workforce-gateway.js',ctx);
assert(ctx.CodeeTitanWorkforceGateway,'gateway missing');
assert.throws(()=>ctx.CodeeTitanWorkforceGateway.createRequest({company_id:'c1',actor_id:'a1',operation:'client.workforce.assign'}),/operation-denied/);
const req=ctx.CodeeTitanWorkforceGateway.createRequest({company_id:'company-1',actor_id:'operator-1',operation:'deployment.mission.list',payload:{}});
assert.equal(req.company_id,'company-1');assert.equal(req.source_surface,'titan_code');assert.equal(req.grants_authority,false);assert(req.idempotency_key);
console.log('PASS Titan Code existing Workforce workspace expanded in place with deployment console gateway');
