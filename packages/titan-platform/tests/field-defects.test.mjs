import test from 'node:test';import assert from 'node:assert/strict';
import {buildTitanFieldDefect,buildTitanPunchList,defectBlocksWorkOrderCompletion,punchListCompletionGateMessage} from '../.test-dist/field-defects.js';
const p={source:'fieldservicepro-donor-convergence',recorded_at:'2026-09-22T00:00:00.000Z',idempotency_key:'x'};
const base={defect_id:'d1',company_id:'c1',punch_list_id:'pl1',work_order_id:'wo1',description:'Unsafe exposed conductor',location:'switchboard',category:'safety',severity:'critical',provenance:p};

test('completed is distinct from independently verified',()=>{
 const d=buildTitanFieldDefect({...base,state:'completed',completed_date:'2026-09-22',after_evidence_refs:['photo-after']});
 assert.equal(d.completion_blocked,true);assert.ok(d.completion_blockers.includes('DEFECT_COMPLETED_NOT_VERIFIED'));assert.ok(d.completion_blockers.includes('CRITICAL_DEFECT_UNRESOLVED'));assert.equal(d.execution_permitted,false);
});
test('verified defect requires verifier and date and then clears the gate',()=>{
 assert.equal(defectBlocksWorkOrderCompletion({severity:'major',state:'verified'}).blocked,true);
 const d=buildTitanFieldDefect({...base,state:'verified',verified_by_ref:'user/reviewer-1',verified_date:'2026-09-22'});
 assert.equal(d.completion_blocked,false);
});
test('punch list aggregates verification rather than treating completed as accepted',()=>{
 const verified={...base,state:'verified',verified_by_ref:'user/reviewer-1',verified_date:'2026-09-22'};
 const completed={...base,defect_id:'d2',severity:'moderate',description:'Paint touch-up',category:'cosmetic',state:'completed'};
 const list=buildTitanPunchList({punch_list_id:'pl1',company_id:'c1',work_order_id:'wo1',title:'Practical completion',state:'in_progress',inspection_date:'2026-09-22',items:[verified,completed],provenance:{...p,idempotency_key:'pl1'}});
 assert.equal(list.total_items,2);assert.equal(list.verified_items,1);assert.equal(list.percent_verified,50);assert.equal(list.completion_blocked,true);assert.match(punchListCompletionGateMessage([list]),/block completion/);assert.equal(list.automatic_work_order_transition,false);
});
test('cross-company and legacy boundaries fail closed',()=>{
 assert.throws(()=>buildTitanPunchList({punch_list_id:'pl1',company_id:'c1',work_order_id:'wo1',title:'x',state:'active',inspection_date:'2026-09-22',items:[{...base,company_id:'c2',state:'open'}],provenance:p}),/company_id must match/);
 assert.throws(()=>buildTitanFieldDefect({...base,state:'open',tenant_id:'legacy'}),/legacy tenant boundary/);
});
