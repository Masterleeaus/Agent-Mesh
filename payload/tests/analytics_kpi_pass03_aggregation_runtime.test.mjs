
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { aggregateMetric, filterWindowObservations, normalizeWindow } from '../titan-runtime/analytics/kpi-aggregation-runtime.mjs';

const root=path.resolve(import.meta.dirname,'../titan-runtime/analytics');
const registry=JSON.parse(fs.readFileSync(path.join(root,'pass02/KPI-REGISTRY.json'),'utf8'));
const byId=new Map(registry.metrics.map(m=>[m.metric_id,m]));
const window={start:'2026-09-01T00:00:00+10:00',end:'2026-09-02T00:00:00+10:00',timezone:'Australia/Melbourne'};

assert.equal(normalizeWindow(window).timezone,'Australia/Melbourne');

const observations=[
 {company_id:'c1',source_id:'jobs-runtime',source_ref:'job:1',event_id:'e1',occurred_at:'2026-09-01T01:00:00+10:00',value:1},
 {company_id:'c1',source_id:'jobs-runtime',source_ref:'job:2',event_id:'e2',occurred_at:'2026-09-01T02:00:00+10:00',value:1},
 {company_id:'c1',source_id:'jobs-runtime',source_ref:'job:2-dupe',event_id:'e2',occurred_at:'2026-09-01T02:00:00+10:00',value:1},
 {company_id:'c2',source_id:'jobs-runtime',source_ref:'job:x',event_id:'x1',occurred_at:'2026-09-01T03:00:00+10:00',value:1},
 {company_id:'c1',source_id:'jobs-runtime',source_ref:'job:late',event_id:'late',occurred_at:'2026-09-02T00:00:00+10:00',value:1}
];

const filtered=filterWindowObservations({company_id:'c1',window,observations});
assert.equal(filtered.accepted.length,2);
assert.deepEqual(filtered.rejected.map(x=>x.reason).sort(),['cross_company','duplicate_event','outside_window']);

const completed=aggregateMetric({
 definition:byId.get('jobs.completed_count'),company_id:'c1',window,observations,generated_at:'2026-09-02T00:00:00+10:00'
});
assert.equal(completed.value,2);
assert.equal(completed.status,'available');
assert.equal(completed.provenance.length,2);
assert.equal(completed.execution_authority,false);

const revenue=aggregateMetric({
 definition:byId.get('revenue.gross_invoiced'),company_id:'c1',window,
 observations:[
  {company_id:'c1',source_id:'invoice-workflow',source_ref:'inv:1',event_id:'i1',occurred_at:'2026-09-01T04:00:00+10:00',value:120},
  {company_id:'c1',source_id:'business-services',source_ref:'inv:2',event_id:'i2',occurred_at:'2026-09-01T05:00:00+10:00',value:80}
 ]
});
assert.equal(revenue.value,200);

const ratio=aggregateMetric({
 definition:byId.get('workforce.utilisation'),company_id:'c1',window,
 observations:[
  {company_id:'c1',source_id:'workforce-runtime',source_ref:'w:n',event_id:'wn',occurred_at:'2026-09-01T06:00:00+10:00',value:6,fields:{role:'numerator'}},
  {company_id:'c1',source_id:'workforce-graph',source_ref:'w:d',event_id:'wd',occurred_at:'2026-09-01T06:00:01+10:00',value:8,fields:{role:'denominator'}}
 ]
});
assert.equal(ratio.value,0.75);

const missing=aggregateMetric({
 definition:byId.get('cash.invoice_outstanding'),company_id:'c1',window,observations:[]
});
assert.equal(missing.status,'missing');
assert.equal(missing.value,null);
assert.match(missing.missing_reason,/no qualifying/);

assert.throws(()=>filterWindowObservations({tenant_id:'legacy',company_id:'c1',window,observations:[]}),/Legacy tenant boundary/);
assert.throws(()=>aggregateMetric({
 tenant_company_id:'legacy',definition:byId.get('jobs.completed_count'),company_id:'c1',window,observations:[]
}),/Legacy tenant boundary/);

console.log('PASS KPI Pass03 deterministic aggregation, isolation, dedupe, windowing and missing-data behavior');
