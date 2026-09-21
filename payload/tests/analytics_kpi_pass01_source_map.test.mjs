import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repo=process.env.TITAN_MERGE42_ROOT;
assert.ok(repo,'TITAN_MERGE42_ROOT required');
const mapPath=path.join(import.meta.dirname,'../titan-runtime/analytics/pass01/KPI-SOURCE-MAP.json');
const map=JSON.parse(fs.readFileSync(mapPath,'utf8'));

assert.equal(map.packet_id,'TZ-NEXT-012');
assert.equal(map.pass,1);
assert.equal(map.live_implementation_base.manager_merge,42);
assert.equal(map.design_rules.company_boundary,'company_id');
assert.equal(map.design_rules.analytics_is_source_of_truth,false);
assert.equal(map.design_rules.analytics_grants_authority,false);
assert.equal(map.design_rules.missing_data_must_not_be_fabricated,true);

const ids=new Set();
for(const source of map.source_authorities){
  assert.ok(source.source_id);
  assert.equal(ids.has(source.source_id),false,`duplicate source_id ${source.source_id}`);
  ids.add(source.source_id);
  assert.equal(fs.existsSync(path.join(repo,source.path)),true,`missing source ${source.path}`);
  assert.notEqual(source.authority,'ANALYTICS_AUTHORITY');
}
assert.ok(ids.size>=12);
console.log(`PASS KPI Pass01 source map: ${ids.size} existing authorities/projections inventoried`);
