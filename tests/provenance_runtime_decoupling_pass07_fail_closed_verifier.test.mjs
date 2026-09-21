import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {verifyProvenanceIntegrity} from '../titan-provenance/verification/provenance-integrity-verifier.mjs';
const root=process.cwd();
const index=JSON.parse(fs.readFileSync('titan-provenance/external-provenance-index.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('TITAN-TRUE-DELTA-DELETIONS.json','utf8'));
const adapters={exists:async p=>fs.existsSync(path.join(root,p)),readBytes:async p=>fs.readFileSync(path.join(root,p))};
const clone=x=>JSON.parse(JSON.stringify(x));

test('real donor-retired/history-retained candidate verifies cleanly',async()=>{
 const r=await verifyProvenanceIntegrity({index,deletionLedger:ledger,...adapters});
 assert.equal(r.ok,true); assert.equal(r.blocker_count,0); assert.equal(r.verified_count,index.references.length); assert.equal(r.grants_authority,false);
});

test('stale canonical equivalence hash fails closed',async()=>{
 const i=clone(index); const ref=i.references.find(r=>r.canonical_equivalent_path); ref.canonical_equivalent_sha256='0'.repeat(64);
 const r=await verifyProvenanceIntegrity({index:i,deletionLedger:ledger,...adapters});
 assert.equal(r.ok,false); assert.ok(r.blockers.some(b=>b.code==='CANONICAL_EQUIVALENCE_HASH_MISMATCH'));
});

test('broken logical locator fails closed before accepting bytes',async()=>{
 const i=clone(index); i.references[0].logical_locator='provenance://sha256/'+'0'.repeat(64);
 const r=await verifyProvenanceIntegrity({index:i,deletionLedger:ledger,...adapters});
 assert.equal(r.ok,false); assert.ok(r.blockers.some(b=>b.code==='BROKEN_LOGICAL_LOCATOR'));
});

test('accidental missing undeclared evidence fails closed',async()=>{
 const i=clone(index); const target=i.references.find(r=>r.original_path.startsWith('titan-agent/history/'));
 const ex=async p=>p===target.original_path?false:adapters.exists(p);
 const r=await verifyProvenanceIntegrity({index:i,deletionLedger:ledger,exists:ex,readBytes:adapters.readBytes});
 assert.equal(r.ok,false); assert.ok(r.blockers.some(b=>b.code==='ACCIDENTAL_EVIDENCE_LOSS'&&b.path===target.original_path));
});

test('declared history deletion without durable binding fails closed',async()=>{
 const i=clone(index); const target=i.references.find(r=>r.original_path.startsWith('titan-agent/history/'));
 const l={deleted:[...ledger.deleted,target.original_path]};
 const ex=async p=>p===target.original_path?false:adapters.exists(p);
 const r=await verifyProvenanceIntegrity({index:i,deletionLedger:l,exists:ex,readBytes:adapters.readBytes});
 assert.equal(r.ok,false); assert.ok(r.blockers.some(b=>b.code==='MISSING_DURABLE_EXTERNAL_BINDING'&&b.path===target.original_path));
});
