import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createKpiValue, createMissingKpiValue, validateMetricDefinition, registryDescriptor} from '../titan-runtime/analytics/kpi-contracts.mjs';

const root=path.resolve(import.meta.dirname,'../titan-runtime/analytics');
const sourceMap=JSON.parse(fs.readFileSync(path.join(root,'pass01/KPI-SOURCE-MAP.json'),'utf8'));
const registry=JSON.parse(fs.readFileSync(path.join(root,'pass02/KPI-REGISTRY.json'),'utf8'));
const sourceIds=sourceMap.source_authorities.map(s=>s.source_id);

assert.equal(registry.company_boundary,'company_id');
assert.equal(registry.authority.analytics_is_source_of_truth,false);
assert.equal(registry.authority.analytics_grants_authority,false);
assert.equal(registry.metrics.length,14);
assert.deepEqual([...new Set(registry.metrics.map(m=>m.domain))].sort(),
  ['cash','customer','jobs','operational_health','quality','revenue','workforce']);

for(const metric of registry.metrics) assert.equal(validateMetricDefinition(metric,sourceIds),true);

const value=createKpiValue({
 metric_id:'jobs.completed_count',company_id:'company-a',
 window:{start:'2026-09-01T00:00:00+10:00',end:'2026-09-02T00:00:00+10:00',timezone:'Australia/Melbourne'},
 status:'available',value:12,unit:'count',
 provenance:[{source_id:'jobs-runtime',source_ref:'job-set:2026-09-01'}]
});
assert.equal(value.company_id,'company-a');
assert.equal(value.execution_authority,false);
assert.equal(value.analytics_granted_authority,false);

const missing=createMissingKpiValue({
 metric_id:'cash.invoice_outstanding',company_id:'company-a',
 window:{start:'2026-09-01',end:'2026-09-02',timezone:'Australia/Melbourne'},
 unit:'currency',missing_reason:'invoice source unavailable',
 provenance:[{source_id:'invoice-workflow',source_ref:'source:unavailable'}]
});
assert.equal(missing.value,null);
assert.equal(missing.status,'missing');

assert.throws(()=>createKpiValue({
 metric_id:'x',tenant_id:'legacy',company_id:'company-a',
 window:{start:'a',end:'b',timezone:'UTC'},status:'available',value:1,
 provenance:[{source_id:'event-ledger',source_ref:'x'}]
}),/Legacy tenant boundary/);

assert.throws(()=>createMissingKpiValue({
 metric_id:'x',company_id:'company-a',window:{start:'a',end:'b',timezone:'UTC'},
 provenance:[{source_id:'event-ledger',source_ref:'x'}]
}),/missing_reason/);

const descriptor=registryDescriptor(registry);
assert.equal(descriptor.metric_count,14);
assert.equal(descriptor.analytics_grants_authority,false);

const serialized=JSON.stringify({registry,value,missing,descriptor});
for(const forbidden of ['tenant_id','tenant_company_id','execution_authority":true','analytics_granted_authority":true'])
  assert.equal(serialized.includes(forbidden),false,forbidden);

console.log('PASS KPI Pass02 registry/contracts: 14 metrics across 7 domains');
