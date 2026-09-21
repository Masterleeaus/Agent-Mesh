import fs from 'node:fs';import assert from 'node:assert/strict';
const g=JSON.parse(fs.readFileSync(new URL('../../titan-workforce/hierarchy/workforce-organizational-graph.json',import.meta.url)));
assert.equal(g.catalogue_hierarchy.length,119);assert.equal(g.orchestrators.length,10);assert.equal(g.atomic_workers.length,70);
const ids=new Set(g.catalogue_hierarchy.map(x=>x.role_definition_id));assert.equal(ids.size,119);
for(const x of g.catalogue_hierarchy){assert.ok(['manager','supervisor','specialist'].includes(x.workforce_tier));if(x.reports_to)assert.ok(ids.has(x.reports_to),`bad reports_to ${x.role_definition_id}`);assert.equal(x.company_boundary,'company_id');assert.equal(x.activation_confers_authority,false)}
for(const w of g.atomic_workers){assert.equal(w.workforce_tier,'worker');assert.equal(w.atomic,true);assert.equal(w.can_delegate,false);assert.ok(ids.has(w.reports_to_specialist));}
const starter=JSON.parse(fs.readFileSync(new URL('../../titan-workforce/starter-agents/starter-agent-registry.json',import.meta.url)));for(const a of starter.agents){assert.equal(a.hierarchy_tier,'orchestrator');assert.ok(ids.has(a.role_definition_id),`invalid orchestrator affinity ${a.agent_key}`)}
console.log(`PASS hierarchy: ${g.counts.managers} managers, ${g.counts.supervisors} supervisors, ${g.counts.specialists} specialists, ${g.counts.recovered_atomic_workers} workers, ${g.counts.orchestrators} orchestrators`);
