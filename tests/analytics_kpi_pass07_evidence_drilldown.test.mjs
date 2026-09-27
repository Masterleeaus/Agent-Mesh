
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildEvidenceLinks,buildMetricDrillDown} from '../titan-runtime/analytics/kpi-evidence-drilldown.mjs';
import {buildAnalyticsSurfaceModel} from '../titan-runtime/analytics/analytics-ui-contributions.mjs';

const root=path.resolve(import.meta.dirname,'../titan-runtime/analytics');
const sourceMap=JSON.parse(fs.readFileSync(path.join(root,'pass01/KPI-SOURCE-MAP.json'),'utf8'));
const sourceIds=sourceMap.source_authorities.map(s=>s.source_id);

const provenance=[
 {source_id:'jobs-runtime',source_ref:'job:123',observed_at:'2026-09-01T01:00:00+10:00'},
 {source_id:'jobs-runtime',source_ref:'job:123',observed_at:'2026-09-01T01:00:00+10:00'},
 {source_id:'supervisor-runtime',source_ref:'inspection:9',observed_at:'2026-09-01T02:00:00+10:00'}
];

const links=buildEvidenceLinks({company_id:'clean-co',metric_id:'cleaning.rework_rate',provenance,allowed_source_ids:sourceIds});
assert.equal(links.length,2);
assert.equal(links.every(x=>x.read_only && x.execution_authority===false),true);
assert.equal(links.every(x=>x.locator.kind==='source_ref'),true);

const dd=buildMetricDrillDown({company_id:'clean-co',metric:{metric_id:'cleaning.rework_rate',provenance},allowed_source_ids:sourceIds});
assert.equal(dd.status,'available');
assert.equal(dd.evidence_links.length,2);

const legacy=buildMetricDrillDown({
 company_id:'clean-co',
 metric:{metric_id:'cleaning.jobs_completed',provenance:[{source_id:'jobs-runtime'}]},
 allowed_source_ids:sourceIds
});
assert.equal(legacy.status,'missing');
assert.equal(legacy.evidence_links.length,0);

const model=buildAnalyticsSurfaceModel({
 company_id:'clean-co',allowed_source_ids:sourceIds,
 metrics:[{metric_id:'cleaning.rework_rate',domain:'quality',status:'available',value:0.1,provenance}]
});
assert.equal(model.metrics[0].drill_down.status,'available');

assert.throws(()=>buildEvidenceLinks({tenant_company_id:'legacy',company_id:'clean-co',metric_id:'x',provenance:[]}),/Legacy tenant boundary/);
assert.throws(()=>buildEvidenceLinks({
 company_id:'clean-co',metric_id:'x',
 provenance:[{source_id:'fake-source',source_ref:'x'}],
 allowed_source_ids:sourceIds
}),/Unknown provenance source_id/);

console.log('PASS KPI Pass07 provenance-backed evidence drill-down links and backward-compatible UI projection integration');
