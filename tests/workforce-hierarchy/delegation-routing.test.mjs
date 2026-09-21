import assert from 'node:assert/strict';
import {resolveDelegationChain,prepareDelegationHandoff,validateDelegationChain,listWorkersForSpecialist} from '../../titan-workforce/hierarchy/delegation-routing-runtime.mjs';

const c='company-demo';
const dispatch=resolveDelegationChain({company_id:c,orchestrator_key:'dispatch',worker_id:'titan.worker.assign_cleaner_agent'});
assert.deepEqual(dispatch.chain.map((x,i)=>i===0?'orchestrator':i===1?'manager':i===2?'supervisor':i===3?'specialist':'worker'),['orchestrator','manager','supervisor','specialist','worker']);
assert.equal(dispatch.manager.role_definition_id,'titan.manager.service');
assert.equal(dispatch.supervisor.role_definition_id,'titan.work.deputy_manager');
assert.equal(dispatch.specialist.role_definition_id,'titan.work.dispatcher');
assert.equal(dispatch.worker.atomic,true);
assert.equal(validateDelegationChain(dispatch).ok,true);

const invoice=resolveDelegationChain({company_id:c,orchestrator_key:'invoicing',worker_id:'titan.worker.create_invoice_agent'});
assert.equal(invoice.manager.role_definition_id,'titan.manager.finance');
assert.equal(invoice.supervisor.role_definition_id,'titan.supervisor.finance_operations');
assert.equal(invoice.supervisor.supplemental,true);
assert.equal(invoice.specialist.role_definition_id,'titan.money.billing_coordinator');
assert.equal(validateDelegationChain(invoice).ok,true);

const handoff=prepareDelegationHandoff({company_id:c,orchestrator_key:'quote',worker_id:'titan.worker.create_quote_agent',task:'Create a quote draft'});
assert.equal(handoff.handoff.state,'PROPOSED');
assert.equal(handoff.handoff.execution_permitted,false);
assert.equal(handoff.handoff.delegation_confers_authority,false);
assert.equal(handoff.grants_authority,false);

assert.ok(listWorkersForSpecialist('titan.customer.customer_care_coordinator').length>=1);
assert.throws(()=>resolveDelegationChain({company_id:'',orchestrator_key:'dispatch',worker_id:'titan.worker.assign_cleaner_agent'}),/company_id/);
assert.throws(()=>resolveDelegationChain({company_id:c,orchestrator_key:'missing',worker_id:'titan.worker.assign_cleaner_agent'}),/orchestrator/);
console.log('delegation-routing: PASS');
