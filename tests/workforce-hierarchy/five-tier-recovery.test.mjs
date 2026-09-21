import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const r=JSON.parse(fs.readFileSync(new URL('../../titan-workforce/hierarchy/five-tier-recovery-registry.json', import.meta.url)));
test('recovered hierarchy has atomic worker layer',()=>{ assert.equal(r.target_model.find(x=>x.name==='Worker').rule.includes('does not delegate'),true); assert.ok(r.legacy_recovery.tier3_atomic_worker_candidates.length >= 60); });
test('legacy candidates are unique',()=>{ const ids=r.legacy_recovery.tier3_atomic_worker_candidates.map(x=>x.id); assert.equal(new Set(ids).size,ids.length); });
test('tools are below workers and are not agents',()=>{ const t=r.target_model.find(x=>x.name==='Tool / Capability'); assert.ok(t.rule.includes('not an agent')); });
