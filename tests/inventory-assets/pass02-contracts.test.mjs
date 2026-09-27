import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const load=(n)=>JSON.parse(fs.readFileSync(path.join(root,'titan-inventory','contracts',n),'utf8'));
for (const name of ['Asset.schema.json','Consumable.schema.json','StockLocation.schema.json']) {
  test(`${name} requires company_id and provenance`,()=>{const s=load(name); assert.ok(s.required.includes('company_id')); assert.ok(s.required.includes('provenance')); assert.equal(s.properties.company_id.type,'string');});
  test(`${name} forbids legacy company aliases`,()=>{const s=load(name); const text=JSON.stringify(s); for (const k of ['tenant_id','tenant_company_id','business_id','account_id','workspace_id']) assert.match(text,new RegExp(k));});
}
test('asset lifecycle covers assignment/maintenance/damage/loss/retirement',()=>{const s=load('Asset.schema.json'); for(const v of ['assigned','maintenance_due','under_maintenance','damaged','lost','retired']) assert.ok(s.properties.lifecycle_state.enum.includes(v));});
test('authority defaults are not inferred by identity contracts',()=>{const a=load('Asset.schema.json'), c=load('Consumable.schema.json'); assert.equal(a.properties.authority.properties.execution_granted.const,false); assert.equal(a.properties.authority.properties.business_authority_granted.const,false); assert.equal(c.properties.authority.properties.purchase_granted.const,false);});
test('stock locations support vehicle/site/worker kit without alternate company boundary',()=>{const s=load('StockLocation.schema.json'); for(const v of ['vehicle','site','worker_kit']) assert.ok(s.properties.location_type.enum.includes(v)); assert.ok(!('tenant_id' in s.properties));});
