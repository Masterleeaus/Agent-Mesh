import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.cwd();
const mod=await import(pathToFileURL(path.join(root,'packages/.tmp-business-workflows-build/runner-contract.js')).href);
const cases=[
 ['new_customer_v1','/api/v1/clients','POST'],['create_quote_v1','/api/v1/estimates','POST'],
 ['service_booking_v1','/api/v1/booking-requests','POST'],['create_job_v1','/api/v1/work-orders','POST'],
 ['complete_job_v1','/api/v1/work-orders/[id]/complete','POST'],['job_variation_approval_v1','/api/v1/work-orders/[id]','PATCH'],
 ['create_invoice_v1','/api/v1/invoices','POST'],['payment-reconciliation','/api/v1/invoices/[id]/payments','POST']
];

test('all retained business workflows plan canonical domain handoffs',()=>{
 for(const [workflowId,surface,method] of cases){const p=mod.buildTitanBusinessWorkflowRunPlan({workflowId,companyId:'c1',actorId:'u1',correlationId:`corr-${workflowId}`,idempotencyKey:`idem-${workflowId}`,input:{example:true}});assert.equal(p.company_id,'c1');assert.equal(p.canonical_domain_surface,surface);assert.equal(p.method,method);assert.equal(p.authority.execution_permitted,false);assert.equal(p.authority.canonical_domain_authorization_required,true);}
});

test('runner owns company boundary and rejects tenant aliases in input',()=>{
 assert.throws(()=>mod.buildTitanBusinessWorkflowRunPlan({workflowId:'create_quote_v1',companyId:'c1',correlationId:'corr',idempotencyKey:'idem',input:{tenant_id:'evil'}}),/workflow-runner-company-boundary-owned:tenant_id/);
 assert.throws(()=>mod.buildTitanBusinessWorkflowRunPlan({workflowId:'create_quote_v1',companyId:'c1',correlationId:'corr',idempotencyKey:'idem',input:{company_id:'evil'}}),/workflow-runner-company-boundary-owned:company_id/);
});

test('authorization denial prevents canonical domain invocation',async()=>{
 const plan=mod.buildTitanBusinessWorkflowRunPlan({workflowId:'create_invoice_v1',companyId:'c1',correlationId:'corr',idempotencyKey:'idem'});let invoked=0;
 const result=await mod.executeTitanBusinessWorkflowRunPlan({plan,adapter:{authorize:()=>false,invoke:()=>{invoked++;}}});
 assert.equal(result.status,'DENIED'); assert.equal(invoked,0);
});

test('authorized execution delegates once to canonical domain adapter',async()=>{
 const plan=mod.buildTitanBusinessWorkflowRunPlan({workflowId:'new_customer_v1',companyId:'c1',correlationId:'corr',idempotencyKey:'idem',input:{name:'A'}});let authorized=0,invoked=0;
 const result=await mod.executeTitanBusinessWorkflowRunPlan({plan,adapter:{authorize:(x)=>{authorized++;assert.equal(x.canonical_domain_surface,'/api/v1/clients');return true;},invoke:(x)=>{invoked++;return {ok:true,company_id:x.company_id};}}});
 assert.equal(result.status,'SUCCEEDED'); assert.equal(authorized,1); assert.equal(invoked,1); assert.deepEqual(result.result,{ok:true,company_id:'c1'});
});

test('runner is orchestration-only: no direct database/runtime imports or network execution',()=>{
 const src=fs.readFileSync(path.join(root,'packages/titan-platform/src/ported/titan-business-services/ownership/runner-contract.ts'),'utf8');
 assert.doesNotMatch(src,/\b(getPool|portableQuery|withTenantTransaction|fetch\s*\()/);
 assert.match(src,/adapter\.authorize/); assert.match(src,/adapter\.invoke/);
});
