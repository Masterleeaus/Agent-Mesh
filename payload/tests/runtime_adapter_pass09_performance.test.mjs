import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { WorkRuntimeAdapter } from '../titan-runtime/adapters/work-runtime-adapter.mjs';
import { RetrieverAdapter } from '../titan-runtime/adapters/retriever-adapter.mjs';
import { negotiateRuntimeAdapter } from '../titan-runtime/adapters/adapter-negotiation.mjs';
import { createTypedLifecycle } from '../titan-runtime/adapters/typed-work-lifecycle.mjs';

const iterations=10000;
const gate={company_id:'company-perf',execution_allowed:true,decision_id:'decision-perf',authority_source:'Titan Governance',policy_version:'policy-v8',approval_state:'approved'};
const adapter=new WorkRuntimeAdapter({runtime:'Retriever',capabilities:['work_submission','progress_observation','result_delivery','cancellation']});
const retriever=new RetrieverAdapter({capabilities:['work_submission','progress_observation','result_delivery','cancellation']});
const input={company_id:'company-perf',work_id:'work-perf',correlation_id:'corr-perf',operation_id:'op-perf',idempotency_key:'idem-perf',execution_gate:gate,payload:{outcome:'Inspect page'},context:{surface:'side-panel'}};
function bench(name,fn){
  for(let i=0;i<100;i++) fn(i);
  const start=performance.now();
  for(let i=0;i<iterations;i++) fn(i);
  const total_ms=performance.now()-start;
  return {name,iterations,total_ms,avg_us:(total_ms*1000)/iterations,ops_per_sec:iterations/(total_ms/1000)};
}
const rows=[];
rows.push(bench('negotiate',()=>negotiateRuntimeAdapter({local_runtime:'Titan',remote_runtime:'Retriever',local_version:'1.0',remote_version:'1.0',local_capabilities:['work_submission','progress_observation','result_delivery','cancellation'],remote_capabilities:['work_submission','progress_observation','result_delivery','cancellation'],required_capabilities:['work_submission']})));
rows.push(bench('prepare_typed_submission',()=>adapter.prepareSubmission(input)));
rows.push(bench('prepare_retriever_compat',()=>retriever.prepareRetrieverSubmission(input)));
const prepared=adapter.prepareSubmission(input);
rows.push(bench('create_lifecycle',()=>createTypedLifecycle(prepared,{started_at:1000,timeout_ms:30000})));
for(const row of rows){ assert.ok(row.avg_us < 5000,`${row.name} unexpectedly exceeds 5ms average`); }
const result={schema:'titan-zero-runtime-adapter-performance/v1',iterations,rows,threshold_avg_us:5000,status:'PASS'};
console.log(JSON.stringify(result));
