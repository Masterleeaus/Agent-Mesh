
import assert from 'node:assert/strict';
import {
  buildAnalyticsSummary,
  exportAnalyticsSummary,
  createAnalyticsSnapshot,
  createLocalSnapshotStore
} from '../titan-runtime/analytics/analytics-summary-snapshots.mjs';

const metrics=[
 {metric_id:'cleaning.jobs_completed',label:'Jobs completed',domain:'jobs',unit:'count',status:'available',value:20,provenance:[{source_id:'jobs-runtime',source_ref:'job:1'}]},
 {metric_id:'cleaning.rework_rate',label:'Rework rate',domain:'quality',unit:'ratio',status:'partial',value:0.05,provenance:[{source_id:'supervisor-runtime',source_ref:'inspection:1'}]},
 {metric_id:'cash.invoice_outstanding',label:'Outstanding',domain:'cash',unit:'currency',status:'missing',value:null,provenance:[]}
];
const base={
 company_id:'clean-co',
 cadence:'weekly',
 window:{start:'2026-09-01T00:00:00+10:00',end:'2026-09-08T00:00:00+10:00',timezone:'Australia/Melbourne'},
 generated_at:'2026-09-09T10:57:00+10:00',
 metrics
};

const summary=buildAnalyticsSummary(base);
assert.equal(summary.metric_count,3);
assert.equal(summary.status_counts.available,1);
assert.equal(summary.status_counts.partial,1);
assert.equal(summary.status_counts.missing,1);
assert.equal(summary.metrics.find(x=>x.metric_id==='cash.invoice_outstanding').value,null);
assert.equal(summary.source_of_truth,false);

for(const cadence of ['daily','weekly','monthly']){
  const s=buildAnalyticsSummary({...base,cadence});
  assert.equal(s.cadence,cadence);
}

const j=exportAnalyticsSummary({...base,format:'json'});
assert.equal(j.mime_type,'application/json');
assert.match(j.file_name,/weekly/);
assert.equal(JSON.parse(j.content).company_id,'clean-co');

const csv=exportAnalyticsSummary({...base,format:'csv'});
assert.equal(csv.mime_type,'text/csv');
assert.match(csv.content,/cleaning\.jobs_completed/);
assert.match(csv.content,/cash\.invoice_outstanding/);

const snap=createAnalyticsSnapshot(base);
assert.equal(snap.cache_policy.local_first,true);
assert.equal(snap.cache_policy.network_required,false);
assert.match(snap.snapshot_key,/clean-co/);

const store=createLocalSnapshotStore({company_id:'clean-co'});
store.put(snap);
assert.equal(store.size(),1);
assert.equal(store.get(snap.snapshot_key).summary.metric_count,3);
assert.equal(store.list().length,1);
assert.equal(store.remove(snap.snapshot_key),true);
assert.equal(store.size(),0);

assert.throws(()=>buildAnalyticsSummary({tenant_id:'legacy',...base}),/Legacy tenant boundary/);
assert.throws(()=>createLocalSnapshotStore({tenant_company_id:'legacy',company_id:'clean-co'}),/Legacy tenant boundary/);

const other=createAnalyticsSnapshot({...base,company_id:'other-co'});
assert.throws(()=>store.put(other),/cross-company snapshot/);

console.log('PASS KPI Pass08 daily/weekly/monthly summaries, JSON/CSV export and local-first snapshot cache');
