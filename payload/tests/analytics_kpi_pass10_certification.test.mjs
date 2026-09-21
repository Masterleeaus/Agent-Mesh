
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildAnalyticsSurfaceModel} from '../titan-runtime/analytics/analytics-ui-contributions.mjs';
import {buildAnalyticsSummary} from '../titan-runtime/analytics/analytics-summary-snapshots.mjs';
import {buildEvidenceLinks} from '../titan-runtime/analytics/kpi-evidence-drilldown.mjs';

const aroot=path.resolve(import.meta.dirname,'../titan-runtime/analytics');
const sourceMap=JSON.parse(fs.readFileSync(path.join(aroot,'pass01/KPI-SOURCE-MAP.json'),'utf8'));
const registry=JSON.parse(fs.readFileSync(path.join(aroot,'pass02/KPI-REGISTRY.json'),'utf8'));
const cleaning=JSON.parse(fs.readFileSync(path.join(aroot,'pass04/CLEANING-KPI-REGISTRY.json'),'utf8'));
const allowed=new Set(sourceMap.source_authorities.map(x=>x.source_id));
for(const def of [...registry.metrics,...cleaning.metrics]){
  for(const source of def.source_ids||[]) assert.ok(allowed.has(source),`${def.metric_id} unknown source ${source}`);
}
const metric={
 metric_id:'cleaning.jobs_completed',label:'Jobs completed',domain:'jobs',unit:'count',
 status:'available',value:4,provenance:[{source_id:'jobs-runtime',source_ref:'job:final-cert'}]
};
const model=buildAnalyticsSurfaceModel({company_id:'cert-co',allowed_source_ids:[...allowed],metrics:[metric]});
assert.equal(model.company_id,'cert-co');
assert.equal(model.execution_authority,false);
assert.equal(model.metrics[0].drill_down.evidence_links[0].source_ref,'job:final-cert');

const summary=buildAnalyticsSummary({
 company_id:'cert-co',cadence:'daily',generated_at:'2026-09-09T11:14:00+10:00',
 window:{start:'2026-09-09T00:00:00+10:00',end:'2026-09-10T00:00:00+10:00',timezone:'Australia/Melbourne'},
 metrics:[metric]
});
assert.equal(summary.metric_count,1);
assert.equal(summary.source_of_truth,false);

const links=buildEvidenceLinks({
 company_id:'cert-co',metric_id:metric.metric_id,provenance:metric.provenance,allowed_source_ids:[...allowed]
});
assert.equal(links.length,1);
assert.equal(links[0].execution_authority,false);
console.log('PASS KPI Pass10 final correctness, provenance, UI projection and authority certification');
