import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildSchedulingCertification} from '../../../titan-workforce/starter-agents/scheduling/scheduling-certification.mjs';
import {evaluateSchedulingBatch} from '../../../titan-workforce/starter-agents/scheduling/scheduling-adversarial-batch.mjs';
import {projectSchedulingBatchObservations,summarizeSchedulingMetrics,buildSchedulingTrace} from '../../../titan-workforce/starter-agents/scheduling/scheduling-observability.mjs';
import {buildSchedulingApprovalEscalation} from '../../../titan-workforce/starter-agents/scheduling/scheduling-approval-escalation.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'../../..');
const capacity={schema:'titan.workforce.workload-capacity.v1',company_id:'c1',worker_capacity:[{worker_id:'w1',available_units:4,capacity_units:4,utilization:0,state:'AVAILABLE'}]};
const skills={schema:'titan.workforce.skill-capability-registry.v1',company_id:'c1',worker_capabilities:[{worker_id:'w1',capability_id:'cleaning.standard',proficiency:3,verification_state:'VERIFIED'}]};
const availability=[{company_id:'c1',worker_id:'w1',windows:[{starts_at:'2026-09-08T00:00:00Z',ends_at:'2026-09-09T00:00:00Z'}]}];
const job={company_id:'c1',schedule_intent_id:'s1',work_item_id:'j1',requested_window:{starts_at:'2026-09-08T10:00:00Z',ends_at:'2026-09-08T11:00:00Z'},required_capacity_units:1,required_capabilities:['cleaning.standard']};

function evidence(){
 const batch=evaluateSchedulingBatch({company_id:'c1',batch_id:'p12',jobs:[job],capacity_snapshot:capacity,skill_registry:skills,availability,existing_assignments:[]});
 const events=projectSchedulingBatchObservations(batch,{company_id:'c1',correlation_id:'p12-corr',operation_id:'p12-op',observed_at:100});
 const metrics=summarizeSchedulingMetrics(events,'c1');
 const trace=buildSchedulingTrace(events,{company_id:'c1',correlation_id:'p12-corr'});
 const recommendation={schema:'titan.scheduling.cleaning-recommendation.v1',company_id:'c1',schedule_intent_id:'s1',work_item_id:'j1',status:'READY_FOR_GOVERNED_ASSIGNMENT',unmet_requirements:[]};
 const approval=buildSchedulingApprovalEscalation({company_id:'c1',operation_id:'p12-op',action_id:'p12-action',risk_level:'low'},recommendation,{company_id:'c1',operation_id:'p12-op',action_id:'p12-action',authority_decision_id:'auth-1',decision:'ALLOW',reason_codes:[]});
 return {batch,events,metrics,trace,approval};
}

test('final certification reports Manager-ready only when all Scheduling invariants are proven',()=>{
 const e=evidence();
 const cert=buildSchedulingCertification({company_id:'c1',claim_id:'TZ-STARTER-SCHEDULING-001',passes_completed:[1,2,3,4,5,6,7,8,9,10,11,12],manager_baseline_merge:39,...e});
 assert.equal(cert.schema,'titan.scheduling.certification.v1');
 assert.equal(cert.status,'READY_FOR_MANAGER_MERGE');
 assert.equal(cert.passes_complete,true);
 assert.equal(cert.company_boundary,'company_id_only');
 assert.equal(cert.authority_neutrality,true);
 assert.equal(cert.execution_permitted,false);
 assert.equal(cert.grants_authority,false);
 assert.equal(cert.claim_release_recommended,true);
 assert.deepEqual(cert.failed_checks,[]);
});

test('certification fails closed for incomplete passes, cross-company evidence, or execution-capable evidence',()=>{
 const e=evidence();
 assert.throws(()=>buildSchedulingCertification({company_id:'c1',claim_id:'x',passes_completed:[1,2,3],manager_baseline_merge:39,...e}),/all-12-passes-required/);
 assert.throws(()=>buildSchedulingCertification({company_id:'c1',claim_id:'x',passes_completed:[1,2,3,4,5,6,7,8,9,10,11,12],manager_baseline_merge:39,...e,metrics:{...e.metrics,company_id:'c2'}}),/cross-company-certification-evidence-denied/);
 assert.throws(()=>buildSchedulingCertification({company_id:'c1',claim_id:'x',passes_completed:[1,2,3,4,5,6,7,8,9,10,11,12],manager_baseline_merge:39,...e,approval:{...e.approval,execution_permitted:true}}),/execution-capable-evidence-denied/);
});

test('certification evidence remains deterministic and does not create authority',()=>{
 const e=evidence();
 const input={company_id:'c1',claim_id:'TZ-STARTER-SCHEDULING-001',passes_completed:[12,11,10,9,8,7,6,5,4,3,2,1],manager_baseline_merge:39,...e};
 const a=buildSchedulingCertification(input);
 const b=buildSchedulingCertification({...input,passes_completed:[1,2,3,4,5,6,7,8,9,10,11,12]});
 assert.deepEqual(a,b);
 assert.equal(a.direct_mutation,false);
 assert.equal(a.execution_permitted,false);
 assert.equal(a.authority_effect,false);
 assert.equal(a.grants_authority,false);
});

test('all Scheduling contracts parse and production modules avoid legacy tenant boundary keys',()=>{
 const base=path.join(root,'titan-workforce/starter-agents/scheduling');
 for(const file of fs.readdirSync(path.join(base,'contracts')).filter(f=>f.endsWith('.json'))){JSON.parse(fs.readFileSync(path.join(base,'contracts',file),'utf8'));}
 for(const file of fs.readdirSync(base).filter(f=>f.endsWith('.mjs'))){
  const text=fs.readFileSync(path.join(base,file),'utf8');
  // Legacy-key names are allowed only inside explicit rejection sets/guards, never as an accepted business boundary assignment.
  assert.doesNotMatch(text,/\b(?:tenant_id|tenant_company_id|workspace_tenant_id)\s*=/,`legacy boundary assignment in ${file}`);
 }
});
