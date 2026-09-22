import test from 'node:test';import assert from 'node:assert/strict';
import {buildWorkforceSlaBusinessCalendar,calculateSlaBusinessDeadline} from '../.test-dist/workforce-capacity/sla-business-calendar.js';
const calendar=buildWorkforceSlaBusinessCalendar({company_id:'c1',calendar_id:'weekday',business_hours_only:true,business_hours_start:'08:00',business_hours_end:'17:00',business_days:['mon','tue','wed','thu','fri'],timezone:'Australia/Melbourne'});
test('business-hours deadline carries remaining budget into next business day',()=>{
 const r=calculateSlaBusinessDeadline({company_id:'c1',start_at:'2026-09-21T06:00:00.000Z',budget_hours:4,calendar});
 assert.equal(r.due_at,'2026-09-22T01:00:00.000Z');assert.equal(r.business_hours_applied,true);assert.equal(r.grants_authority,false);
});
test('weekend start advances to next business opening',()=>{
 const r=calculateSlaBusinessDeadline({company_id:'c1',start_at:'2026-09-19T02:00:00.000Z',budget_hours:2,calendar});
 assert.equal(r.due_at,'2026-09-21T00:00:00.000Z');
});
test('24-hour SLA bypasses business calendar',()=>{
 const c=buildWorkforceSlaBusinessCalendar({company_id:'c1',calendar_id:'24x7',business_hours_only:false,timezone:'UTC'});
 const r=calculateSlaBusinessDeadline({company_id:'c1',start_at:'2026-09-21T12:00:00.000Z',budget_hours:4,c});
 assert.equal(r.due_at,'2026-09-21T16:00:00.000Z');assert.equal(r.business_hours_applied,false);
});
test('cross-company and legacy tenant boundaries fail closed',()=>{
 assert.throws(()=>calculateSlaBusinessDeadline({company_id:'c2',start_at:'2026-09-21T12:00:00Z',budget_hours:1,calendar}),/company_id must match/);
 assert.throws(()=>buildWorkforceSlaBusinessCalendar({company_id:'c1',calendar_id:'bad',business_hours_only:true,account_id:'legacy'}),/legacy tenant boundary/i);
});
test('invalid calendar windows fail closed',()=>assert.throws(()=>buildWorkforceSlaBusinessCalendar({company_id:'c1',calendar_id:'bad',business_hours_only:true,business_hours_start:'17:00',business_hours_end:'08:00'}),/must be after/));
