import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.env.TITAN_DELTA_ROOT || process.cwd();
const py=fs.readFileSync(path.join(root,'tests/test_v11_convergence.py'),'utf8');
test('v11 regression no longer requires donor physical presence',()=>{
 assert.ok(!py.includes("'workforce/donor/installed-client-workforce-master.json'\n    ]"));
 assert.match(py,/external-provenance-index\.json/);
 assert.match(py,/canonical_sha/);
});
test('regression preserves exact donor semantic identity by sha256',()=>{
 assert.match(py,/donor\['sha256'\]==canonical_sha/);
 assert.match(py,/provenance:\/\/sha256/);
});
