import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const readJson=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));

test('all historical provenance references are runtime-unpackaged and audit-required',()=>{
  const idx=readJson('titan-provenance/external-provenance-index.json');
  const hist=idx.references.filter(r=>r.original_path.startsWith('titan-agent/history/'));
  assert.equal(hist.length,51);
  for (const r of hist) {
    assert.equal(r.runtime_packaged,false);
    assert.equal(r.resolution_required_for_audit,true);
  }
});

test('development canonical history remains retained until durable bindings exist',()=>{
  const idx=readJson('titan-provenance/external-provenance-index.json');
  assert.equal(idx.history_runtime_packaging.development_canonical,'RETAINED_PENDING_DURABLE_EXTERNAL_BINDING');
  assert.equal(idx.history_runtime_packaging.deploy_runtime,'EXCLUDED_AS_AGENT_PASS_EVIDENCE_PROVENANCE');
  assert.equal(idx.history_runtime_packaging.automatic_history_deletion,false);
});

test('Pass5 deletion ledger does not delete historical evidence',()=>{
  const ledger=readJson('TITAN-TRUE-DELTA-DELETIONS.json');
  assert.ok(!ledger.deleted.some(p=>p.startsWith('titan-agent/history/')));
});

test('history pass fails closed because external bindings are incomplete',()=>{
  const d=readJson('diagnostics/provenance/history-runtime-decoupling-pass06.json');
  assert.equal(d.external_bindings_complete,false);
  assert.equal(d.history_deletion_scheduled,false);
});
