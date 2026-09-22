import test from 'node:test';import assert from 'node:assert/strict';
import {buildTitanProjectRfi,deriveRfiTiming,rfiChangeOrderRecommendation} from '../.test-dist/project-rfi.js';
const provenance={source:'fieldservicepro-donor-convergence',recorded_at:'2026-09-22T00:00:00.000Z',idempotency_key:'rfi-1'};
const base={rfi_id:'rfi-1',company_id:'c1',project_id:'p1',work_order_id:'wo1',subject:'Switchboard clearance',question:'Confirm revised clearance requirement',submitted_by_ref:'user/1',state:'open',priority:'high',date_submitted:'2026-09-10',date_required:'2026-09-20',cost_impact:'potential',schedule_impact:'confirmed',schedule_impact_days:3,provenance};

test('RFI tracks overdue and impact without creating a change order',()=>{
 const rfi=buildTitanProjectRfi(base,{as_of:'2026-09-22'});
 assert.equal(rfi.is_overdue,true);assert.equal(rfi.days_open,12);assert.equal(rfi.automatic_change_order_creation,false);assert.equal(rfi.automatic_change_order_approval,false);assert.equal(rfi.execution_permitted,false);
 const rec=rfiChangeOrderRecommendation(rfi);assert.equal(rec.recommended,true);assert.equal(rec.create_change_order,false);assert.equal(rec.grants_authority,false);
});
test('existing change-order reference suppresses duplicate recommendation',()=>{
 const rfi=buildTitanProjectRfi({...base,related_change_order_id:'co-9'},{as_of:'2026-09-22'});
 assert.equal(rfiChangeOrderRecommendation(rfi).recommended,false);assert.equal(rfi.related_change_order_is_reference_only,true);
});
test('answered RFI requires response and stops overdue clock',()=>{
 assert.throws(()=>buildTitanProjectRfi({...base,state:'answered',response_date:'2026-09-18T12:00:00Z'}),/requires a response/);
 const rfi=buildTitanProjectRfi({...base,state:'answered',response:'Use 600mm clearance',responded_by_ref:'user/2',response_date:'2026-09-18T12:00:00Z'});
 assert.equal(rfi.is_overdue,false);assert.equal(rfi.days_open,8);
});
test('confirmed impacts require quantified values',()=>{
 assert.throws(()=>buildTitanProjectRfi({...base,cost_impact:'confirmed'}),/cost_impact_cents/);
 assert.throws(()=>buildTitanProjectRfi({...base,schedule_impact:'confirmed',schedule_impact_days:null}),/schedule_impact_days/);
});
test('legacy tenant aliases fail closed',()=>{
 assert.throws(()=>buildTitanProjectRfi({...base,account_id:'legacy'}),/legacy tenant boundary/);
 assert.deepEqual(deriveRfiTiming({state:'closed',date_submitted:'2026-09-10',response_date:'2026-09-15T00:00:00Z',date_required:'2026-09-12',as_of:'2026-09-22'}),{days_open:5,is_overdue:false});
});
test('RFI response lifecycle and chronology fail closed',()=>{
 assert.throws(()=>buildTitanProjectRfi({...base,state:'answered',response:'ok',response_date:'2026-09-18T12:00:00Z'}),/responded_by_ref/);
 assert.throws(()=>buildTitanProjectRfi({...base,state:'answered',response:'ok',responded_by_ref:'user\/2'}),/response_date/);
 assert.throws(()=>buildTitanProjectRfi({...base,state:'answered',response:'ok',responded_by_ref:'user\/2',response_date:'2026-09-09T12:00:00Z'}),/must not precede date_submitted/);
 assert.throws(()=>buildTitanProjectRfi({...base,date_required:'2026-09-09'}),/date_required must not precede date_submitted/);
});
