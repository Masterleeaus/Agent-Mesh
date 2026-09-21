import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.argv[2]; if(!root) throw new Error('root-required');
const graph=JSON.parse(fs.readFileSync(path.join(root,'titan-workforce/hierarchy/workforce-organizational-graph.json'),'utf8'));
const bindings=JSON.parse(fs.readFileSync(path.join(root,'titan-workforce/hierarchy/atomic-worker-tool-bindings.json'),'utf8'));
const tools=JSON.parse(fs.readFileSync(path.join(root,'titan-tools/TOOL-REGISTRY.json'),'utf8'));
const mod=await import(pathToFileURL(path.join(root,'titan-workforce/hierarchy/atomic-worker-tool-binding-runtime.mjs')).href);
assert.equal(bindings.worker_count,70); assert.equal(bindings.bindings.length,graph.atomic_workers.length);
const ids=new Set(tools.tools.map(t=>t.tool_id));
for(const b of bindings.bindings){assert.equal(b.company_boundary,'company_id');assert.equal(b.binding_grants_authority,false);assert.equal(b.worker_can_delegate,false);assert.ok(b.tool_ids.length);for(const id of b.tool_ids)assert.ok(ids.has(id),`${b.worker_id}:${id}`);if(b.requires_approval){assert.equal(b.requires_idempotency_key,true);assert.equal(b.requires_execution_receipt,true);}}
const sendInvoice=mod.resolveAtomicWorkerTools({company_id:'co-test',worker_id:'titan.worker.send_invoice_agent'});assert.equal(sendInvoice.requires_approval,true);assert.ok(sendInvoice.tools.some(t=>t.tool_id==='browser_actions'));
const blocked=mod.prepareAtomicWorkerExecution({company_id:'co-test',worker_id:'titan.worker.send_invoice_agent',operation:'send approved invoice'});assert.deepEqual(blocked.proposal.blocked_reasons,['APPROVAL_REQUIRED','IDEMPOTENCY_KEY_REQUIRED']);assert.equal(blocked.execution_permitted,false);
const ready=mod.prepareAtomicWorkerExecution({company_id:'co-test',worker_id:'titan.worker.send_invoice_agent',operation:'send approved invoice',approval_granted:true,idempotency_key:'idem-1'});assert.equal(ready.proposal.state,'READY_FOR_AUTHORITY_GATE');assert.equal(ready.execution_permitted,false);assert.equal(ready.proposal.grants_authority,false);
assert.throws(()=>mod.resolveAtomicWorkerTools({company_id:'x',worker_id:'titan.worker.send_invoice_agent'}),/company_id/);
console.log('five-tier-worker-tool-binding: PASS');
