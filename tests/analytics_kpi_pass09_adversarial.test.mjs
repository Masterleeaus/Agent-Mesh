
import assert from 'node:assert/strict';
import {aggregateMetric} from '../titan-runtime/analytics/kpi-aggregation-runtime.mjs';
import {compareMetricWindows} from '../titan-runtime/analytics/kpi-trend-variance.mjs';
import {buildAnalyticsSummary,createAnalyticsSnapshot,createLocalSnapshotStore} from '../titan-runtime/analytics/analytics-summary-snapshots.mjs';
import {buildEvidenceLinks} from '../titan-runtime/analytics/kpi-evidence-drilldown.mjs';

const countDef={
 metric_id:'cleaning.jobs_completed',
 domain:'jobs',
 unit:'count',
 aggregation:'count',
 source_ids:['jobs-runtime']
};
const ratioDef={
 metric_id:'cleaning.rework_rate',
 domain:'quality',
 unit:'ratio',
 aggregation:'ratio',
 source_ids:['supervisor-runtime']
};
const w={
 start:'2026-10-04T00:00:00+10:00',
 end:'2026-10-05T00:00:00+11:00',
 timezone:'Australia/Melbourne'
};

// 1. Cross-company observations must never leak into a company result.
const mixed=[
 {company_id:'c1',source_id:'jobs-runtime',source_ref:'job:1',event_id:'e1',occurred_at:'2026-10-04T01:00:00+10:00',value:1},
 {company_id:'c2',source_id:'jobs-runtime',source_ref:'job:2',event_id:'e2',occurred_at:'2026-10-04T01:05:00+10:00',value:1}
];
const isolated=aggregateMetric({company_id:'c1',definition:countDef,window:w,observations:mixed});
assert.equal(isolated.value,1);
assert.equal(isolated.provenance.length,1);
assert.equal(isolated.provenance[0].source_ref,'job:1');

// 2. Duplicate event replay must count only once, even with differing source_ref copies.
const dup=[
 {company_id:'c1',source_id:'jobs-runtime',source_ref:'job:1',event_id:'same',occurred_at:'2026-10-04T01:00:00+10:00',value:1},
 {company_id:'c1',source_id:'jobs-runtime',source_ref:'job:1-copy',event_id:'same',occurred_at:'2026-10-04T01:00:01+10:00',value:1}
];
const deduped=aggregateMetric({company_id:'c1',definition:countDef,window:w,observations:dup});
assert.equal(deduped.value,1);
assert.equal(deduped.provenance.length,1);

// 3. Half-open boundary semantics across Melbourne DST start:
// exact start included, exact end excluded.
const dstEdges=[
 {company_id:'c1',source_id:'jobs-runtime',source_ref:'start',event_id:'start',occurred_at:'2026-10-04T00:00:00+10:00',value:1},
 {company_id:'c1',source_id:'jobs-runtime',source_ref:'inside-before-jump',event_id:'pre',occurred_at:'2026-10-04T01:59:59+10:00',value:1},
 {company_id:'c1',source_id:'jobs-runtime',source_ref:'inside-after-jump',event_id:'post',occurred_at:'2026-10-04T03:00:00+11:00',value:1},
 {company_id:'c1',source_id:'jobs-runtime',source_ref:'end',event_id:'end',occurred_at:'2026-10-05T00:00:00+11:00',value:1}
];
const dstResult=aggregateMetric({company_id:'c1',definition:countDef,window:w,observations:dstEdges});
assert.equal(dstResult.value,3);
assert.deepEqual(dstResult.provenance.map(x=>x.source_ref).sort(),['inside-after-jump','inside-before-jump','start']);

// 4. Same instant represented with another offset remains compared by absolute instant.
const equivalentOffset=[
 {company_id:'c1',source_id:'jobs-runtime',source_ref:'equiv',event_id:'equiv',
  occurred_at:'2026-10-03T14:00:00Z',value:1}
];
const equivalent=aggregateMetric({company_id:'c1',definition:countDef,window:w,observations:equivalentOffset});
assert.equal(equivalent.value,1);

// 5. Partial trend input propagates partial; missing input cannot become zero.
const partialTrend=compareMetricWindows({
 company_id:'c1',
 previous:{metric_id:'cleaning.jobs_completed',company_id:'c1',status:'partial',value:8,window:{start:'p',end:'q'},provenance:[]},
 current:{metric_id:'cleaning.jobs_completed',company_id:'c1',status:'available',value:10,window:{start:'q',end:'r'},provenance:[]}
});
assert.equal(partialTrend.status,'partial');
assert.equal(partialTrend.delta,2);

const missingTrend=compareMetricWindows({
 company_id:'c1',
 previous:{metric_id:'cleaning.jobs_completed',company_id:'c1',status:'missing',value:null,provenance:[]},
 current:{metric_id:'cleaning.jobs_completed',company_id:'c1',status:'available',value:10,provenance:[]}
});
assert.equal(missingTrend.status,'missing');
assert.equal(missingTrend.delta,null);
assert.equal(missingTrend.percent_change,null);

// 6. A stale KPI must remain stale in summaries and snapshots, never promoted.
const staleMetric={
 metric_id:'operational_health.data_freshness',
 label:'Data freshness',
 domain:'operational_health',
 unit:'age',
 status:'stale',
 value:7200,
 provenance:[{source_id:'event-ledger',source_ref:'ledger:stale'}]
};
const summary=buildAnalyticsSummary({
 company_id:'c1',cadence:'daily',
 window:{start:'2026-10-04T00:00:00+10:00',end:'2026-10-05T00:00:00+11:00',timezone:'Australia/Melbourne'},
 generated_at:'2026-10-05T00:05:00+11:00',
 metrics:[staleMetric]
});
assert.equal(summary.status_counts.stale,1);
assert.equal(summary.metrics[0].status,'stale');
assert.equal(summary.metrics[0].value,7200);

const snap=createAnalyticsSnapshot({
 company_id:'c1',cadence:'daily',
 window:{start:'2026-10-04T00:00:00+10:00',end:'2026-10-05T00:00:00+11:00',timezone:'Australia/Melbourne'},
 generated_at:'2026-10-05T00:05:00+11:00',
 metrics:[staleMetric]
});
assert.equal(snap.summary.metrics[0].status,'stale');

// 7. Snapshot stores must reject a snapshot from another company.
const store=createLocalSnapshotStore({company_id:'c1'});
store.put(snap);
const other=createAnalyticsSnapshot({
 company_id:'c2',cadence:'daily',
 window:{start:'2026-10-04T00:00:00+10:00',end:'2026-10-05T00:00:00+11:00',timezone:'Australia/Melbourne'},
 generated_at:'2026-10-05T00:05:00+11:00',metrics:[staleMetric]
});
assert.throws(()=>store.put(other),/cross-company snapshot/);

// 8. Evidence links validate source ids and deterministically collapse duplicates.
const evidence=buildEvidenceLinks({
 company_id:'c1',metric_id:'cleaning.jobs_completed',
 allowed_source_ids:['jobs-runtime'],
 provenance:[
   {source_id:'jobs-runtime',source_ref:'job:1'},
   {source_id:'jobs-runtime',source_ref:'job:1'},
   {source_id:'jobs-runtime',source_ref:'job:2'}
 ]
});
assert.equal(evidence.length,2);
assert.deepEqual(evidence.map(x=>x.source_ref),['job:1','job:2']);

// 9. Legacy tenant aliases must fail closed at every public surface tested here.
assert.throws(()=>aggregateMetric({tenant_id:'x',company_id:'c1',definition:countDef,window:w,observations:[]}),/Legacy tenant boundary/);
assert.throws(()=>buildAnalyticsSummary({
 tenant_company_id:'x',company_id:'c1',cadence:'daily',
 window:{start:'2026-10-04T00:00:00+10:00',end:'2026-10-05T00:00:00+11:00',timezone:'Australia/Melbourne'},
 generated_at:'2026-10-05T00:05:00+11:00',metrics:[]
}),/Legacy tenant boundary/);

// 10. Ratio with missing/zero denominator must not fabricate a value.
// Using no accepted observations is a guaranteed missing case under current contract.
const missingRatio=aggregateMetric({company_id:'c1',definition:ratioDef,window:w,observations:[]});
assert.equal(missingRatio.status,'missing');
assert.equal(missingRatio.value,null);

console.log('PASS KPI Pass09 adversarial isolation, replay dedupe, stale/partial preservation and Melbourne DST boundaries');
