import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {summarizeUnpackedPayload,comparePayloadBaseline} from '../titan-runtime/performance/payload-baseline.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'titan-runtime/performance/payload-baseline-merge41.json'),'utf8'));

test('Pass01 baseline is pinned to Manager Merge41',()=>{
  assert.equal(baseline.manager_base.merge,41);
  assert.equal(baseline.manager_base.sha256,'dfbd39a0475de73dc00bc1dee82c3969194a45db0ae8fc1fc0a92651641addd2');
  assert.equal(baseline.manager_base.file_count,2989);
});

test('package baseline captures compressed and uncompressed evidence',()=>{
  assert.equal(baseline.package.uncompressed_bytes,185293390);
  assert.equal(baseline.package.compressed_bytes,70934950);
  assert.ok(baseline.package.compression_ratio>0 && baseline.package.compression_ratio<1);
});

test('document-start compatibility payload is explicitly measured',()=>{
  assert.equal(baseline.manifest_startup_entries.content_scripts.uncompressed_bytes,29701069);
  assert.equal(baseline.manifest_startup_entries.content_css.uncompressed_bytes,2543467);
  assert.ok(baseline.manifest_startup_entries.content_scripts.files.some(x=>x.path==='titan-zero-chat-content.compat.js'));
});

test('service worker transitive static import closure is measured',()=>{
  const sw=baseline.service_worker_static_import_closure;
  assert.equal(sw.entry,'background-bootstrap.js');
  assert.equal(sw.files,78);
  assert.equal(sw.uncompressed_bytes,15179156);
  assert.equal(sw.compressed_bytes,4435495);
});

test('startup timing/memory baseline preserves Load Stability profiler evidence',()=>{
  const profile=baseline.inherited_startup_profile;
  assert.equal(profile.sample_count,15);
  assert.equal(profile.p50_duration_ms,31.083);
  assert.equal(profile.p95_duration_ms,33.214);
  assert.equal(profile.p95_heap_delta_bytes,206608);
  assert.equal(profile.measured_environment,'node-mocked-chrome-api');
  assert.equal(profile.ok,true);
  assert.equal(baseline.measurement_limits.live_chrome_memory,'NOT_MEASURED_PASS01');
});

test('measurement helpers are authority-neutral',()=>{
  const summary=summarizeUnpackedPayload(path.join(root,'titan-runtime/performance'));
  assert.ok(summary.file_count>=2);
  assert.equal(summary.authority_effect,false);
  assert.equal(summary.grants_authority,false);
  assert.equal(summary.identity_not_authority,true);
  const delta=comparePayloadBaseline({uncompressed_bytes:100},{uncompressed_bytes:80});
  assert.equal(delta.delta_bytes,-20);
  assert.equal(delta.grants_authority,false);
});
