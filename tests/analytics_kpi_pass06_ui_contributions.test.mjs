
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createAnalyticsUiContributions,installAnalyticsUiContributions,buildAnalyticsSurfaceModel} from '../titan-runtime/analytics/analytics-ui-contributions.mjs';

const root=process.env.TITAN_MERGE42_ROOT;
assert.ok(root,'TITAN_MERGE42_ROOT required');
const registryModule=await import(pathToFileURL(path.join(root,'titan-capabilities/contributions/registry.mjs')).href);
const registry=registryModule.createContributionRegistry({company_id:'clean-co'});

const metrics=[
 {metric_id:'cleaning.jobs_completed',label:'Jobs completed',domain:'jobs',unit:'count',status:'available',value:18,trend:{direction:'up'},provenance:[{source_id:'jobs-runtime'}]},
 {metric_id:'cleaning.rework_rate',label:'Rework rate',domain:'quality',unit:'ratio',status:'partial',value:0.05,variance:null,provenance:[{source_id:'supervisor-runtime'}]}
];

const model=buildAnalyticsSurfaceModel({company_id:'clean-co',metrics});
assert.equal(model.company_id,'clean-co');
assert.equal(model.read_only,true);
assert.equal(model.source_of_truth,false);
assert.equal(model.metrics.length,2);
assert.equal(model.groups.jobs.length,1);
assert.equal(model.groups.quality.length,1);

const raw=createAnalyticsUiContributions({company_id:'clean-co',metrics});
assert.equal(raw.length,2);
assert.equal(raw.every(x=>x.metadata.replaces_existing_page===false),true);

const installed=installAnalyticsUiContributions(registry,{company_id:'clean-co',metrics});
assert.equal(installed.length,2);
assert.equal(registry.discover({kind:'projection',provider_id:'titan.analytics'}).length,1);
assert.equal(registry.discover({kind:'presentation',provider_id:'titan.analytics'}).length,1);
for(const entry of registry.discover({provider_id:'titan.analytics'})){
  assert.equal(entry.company_id,'clean-co');
  assert.equal(entry.authority_neutral,true);
  assert.equal(entry.activation_confers_authority,false);
}
assert.throws(()=>createAnalyticsUiContributions({tenant_id:'legacy',company_id:'clean-co',metrics}),/Legacy tenant boundary/);
assert.throws(()=>installAnalyticsUiContributions(registry,{company_id:'other-co',metrics}),/cross-company-contribution/);

console.log('PASS KPI Pass06 UI contribution wiring through existing ContributionRegistry');
