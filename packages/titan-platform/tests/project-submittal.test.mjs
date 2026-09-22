import test from 'node:test';import assert from 'node:assert/strict';
import {buildTitanProjectSubmittal,deriveSubmittalReviewTiming,submittalRevisionRecommendation} from '../.test-dist/project-submittal.js';
const provenance={source:'fieldservicepro-donor-convergence',recorded_at:'2026-09-22T00:00:00.000Z',idempotency_key:'sub-1'};
const base={submittal_id:'sub-1',company_id:'c1',project_id:'p1',work_order_id:'wo1',title:'Switchboard product data',submittal_type:'product_data',submitted_by_ref:'user/1',state:'under_review',revision_number:1,date_submitted:'2026-09-10',date_required:'2026-09-20',document_refs:['document/spec-1'],provenance};

test('submittal uses canonical document references and remains non-authoritative',()=>{
 const s=buildTitanProjectSubmittal(base,{as_of:'2026-09-22'});
 assert.equal(s.is_overdue,true);assert.equal(s.days_in_review,12);assert.equal(s.document_refs_only,true);assert.equal(s.automatic_document_copy,false);assert.equal(s.automatic_purchase_order_creation,false);assert.equal(s.execution_permitted,false);
});
test('revision chain is explicit and revise/resubmit only recommends a new revision',()=>{
 const s=buildTitanProjectSubmittal({...base,submittal_id:'sub-2',state:'revise_and_resubmit',revision_number:2,previous_submittal_id:'sub-1',review_comments:'Update enclosure rating',date_reviewed:'2026-09-18'});
 const rec=submittalRevisionRecommendation(s);assert.equal(rec.recommended,true);assert.equal(rec.next_revision_number,3);assert.equal(rec.create_revision,false);assert.equal(rec.copy_documents,false);
});
test('invalid revision lineage fails closed',()=>{
 assert.throws(()=>buildTitanProjectSubmittal({...base,revision_number:2}),/previous_submittal_id/);
 assert.throws(()=>buildTitanProjectSubmittal({...base,previous_submittal_id:'sub-0'}),/revision 1/);
});
test('review outcomes require review evidence',()=>{
 assert.throws(()=>buildTitanProjectSubmittal({...base,state:'approved'}),/date_reviewed/);
 assert.throws(()=>buildTitanProjectSubmittal({...base,state:'approved_as_noted',date_reviewed:'2026-09-18'}),/review_comments/);
});
test('product cost is derived without creating procurement authority',()=>{
 const s=buildTitanProjectSubmittal({...base,quantity:3,unit_cost_cents:12500});
 assert.equal(s.total_cost_cents,37500);assert.equal(s.automatic_purchase_order_creation,false);assert.equal(s.grants_authority,false);
});
test('legacy tenant aliases fail closed and reviewed records stop overdue clock',()=>{
 assert.throws(()=>buildTitanProjectSubmittal({...base,tenant_company_id:'legacy'}),/legacy tenant boundary/);
 assert.deepEqual(deriveSubmittalReviewTiming({state:'approved',date_submitted:'2026-09-10',date_required:'2026-09-12',date_reviewed:'2026-09-15',as_of:'2026-09-22'}),{days_in_review:5,is_overdue:false});
});
