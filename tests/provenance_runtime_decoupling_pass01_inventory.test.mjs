import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[1] ? process.cwd() : process.cwd();
const invPath = path.join(root, 'diagnostics/provenance/runtime-provenance-reference-inventory.json');
const inv = JSON.parse(fs.readFileSync(invPath,'utf8'));
test('Pass1 inventory is Merge46 scoped and non-destructive',()=>{
  assert.equal(inv.packet_id,'TZ-FIX-PROVENANCE-RUNTIME-DECOUPLING-001');
  assert.equal(inv.pass,1); assert.equal(inv.manager_baseline.merge,46);
  assert.equal(inv.pass1_changes_runtime,false); assert.equal(inv.retirement_performed,false);
});
test('inventory captures history and workforce donor payloads',()=>{
  assert.ok(inv.history_payload_file_count >= 1);
  assert.equal(inv.workforce_donor_comparison.donor_path,'workforce/donor/installed-client-workforce-master.json');
  assert.equal(inv.workforce_donor_comparison.canonical_path,'titan-workforce/catalogue/installed-client-workforce-master.json');
});
test('inventory records all reference categories with line evidence',()=>{
  assert.ok(inv.reference_file_count >= 1);
  for (const ref of inv.references) { assert.ok(ref.sha256); assert.ok(ref.matches.length); for (const m of ref.matches) assert.ok(m.line > 0); }
});
test('runtime consumers remain explicitly visible for later classification',()=>{
  const runtime = new Set(inv.references.filter(x=>x.kind==='runtime_code').map(x=>x.path));
  assert.ok(runtime.has('titan-workforce-agent-profile.js'));
  assert.ok(runtime.has('titan-client-workforce-controls.js'));
  assert.ok(runtime.has('titan-modules/module-host.mjs'));
});
