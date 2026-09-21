
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {mergeCleaningMetrics,validateCleaningMetric} from '../titan-runtime/analytics/cleaning-kpi-definitions.mjs';
import {aggregateMetric} from '../titan-runtime/analytics/kpi-aggregation-runtime.mjs';

const root=path.resolve(import.meta.dirname,'../titan-runtime/analytics');
const sourceMap=JSON.parse(fs.readFileSync(path.join(root,'pass01/KPI-SOURCE-MAP.json'),'utf8'));
const base=JSON.parse(fs.readFileSync(path.join(root,'pass02/KPI-REGISTRY.json'),'utf8'));
const cleaning=JSON.parse(fs.readFileSync(path.join(root,'pass04/CLEANING-KPI-REGISTRY.json'),'utf8'));
const sourceIds=sourceMap.source_authorities.map(s=>s.source_id);

assert.equal(cleaning.company_boundary,'company_id');
assert.equal(cleaning.authority.derived_only,true);
assert.equal(cleaning.authority.analytics_grants_authority,false);
assert.equal(cleaning.metrics.length,12);

for(const metric of cleaning.metrics) assert.equal(validateCleaningMetric(metric,sourceIds),true);

const merged=mergeCleaningMetrics(base,cleaning,sourceIds);
assert.equal(merged.metrics.length,26);
assert.equal(merged.analytics_grants_authority,false);
assert.equal(new Set(merged.metrics.map(m=>m.metric_id)).size,26);

const byId=new Map(cleaning.metrics.map(m=>[m.metric_id,m]));
const window={start:'2026-09-01T00:00:00+10:00',end:'2026-09-08T00:00:00+10:00',timezone:'Australia/Melbourne'};

const completed=aggregateMetric({
 definition:byId.get('cleaning.jobs_completed'),company_id:'clean-co',window,
 observations:[
  {company_id:'clean-co',source_id:'jobs-runtime',source_ref:'job:1',event_id:'j1',occurred_at:'2026-09-01T09:00:00+10:00',value:1},
  {company_id:'clean-co',source_id:'cleaning-workforce',source_ref:'job:2',event_id:'j2',occurred_at:'2026-09-02T09:00:00+10:00',value:1},
  {company_id:'other',source_id:'jobs-runtime',source_ref:'job:x',event_id:'jx',occurred_at:'2026-09-02T10:00:00+10:00',value:1}
 ]
});
assert.equal(completed.value,2);

const conversion=aggregateMetric({
 definition:byId.get('cleaning.quote_conversion_rate'),company_id:'clean-co',window,
 observations:[
  {company_id:'clean-co',source_id:'sales-contract',source_ref:'quote:accepted',event_id:'q1',occurred_at:'2026-09-03T09:00:00+10:00',value:3,fields:{role:'numerator'}},
  {company_id:'clean-co',source_id:'sales-lead-response',source_ref:'quote:eligible',event_id:'q2',occurred_at:'2026-09-03T09:01:00+10:00',value:5,fields:{role:'denominator'}}
 ]
});
assert.equal(conversion.value,0.6);

const recurring=aggregateMetric({
 definition:byId.get('cleaning.recurring_revenue'),company_id:'clean-co',window,
 observations:[
  {company_id:'clean-co',source_id:'invoice-workflow',source_ref:'invoice:1',event_id:'r1',occurred_at:'2026-09-04T09:00:00+10:00',value:150},
  {company_id:'clean-co',source_id:'business-services',source_ref:'invoice:2',event_id:'r2',occurred_at:'2026-09-05T09:00:00+10:00',value:200}
 ]
});
assert.equal(recurring.value,350);

const noRatio=aggregateMetric({
 definition:byId.get('cleaning.rework_rate'),company_id:'clean-co',window,
 observations:[
   {company_id:'clean-co',source_id:'jobs-runtime',source_ref:'job:rework',event_id:'rw1',occurred_at:'2026-09-06T09:00:00+10:00',value:1,fields:{role:'numerator'}}
 ]
});
assert.equal(noRatio.status,'missing');
assert.equal(noRatio.value,null);

console.log('PASS KPI Pass04 cleaning metrics: 12 definitions, merged registry 26 metrics, deterministic examples pass');
