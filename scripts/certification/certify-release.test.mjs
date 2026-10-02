import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { deriveCertificationCoverage } from '../../packages/titan-platform/src/certification-matrix.ts';
import { inputs } from '../../packages/titan-platform/tests/fixtures/certification-inputs.mjs';

for (const mode of ['complete','omitted','skipped','missing-upstream','malformed-json','stale']) {
  test(`CLI integration ${mode} uses independent inputs and an exit-code gate`,()=>{
    const directory=mkdtempSync(join(tmpdir(),'certification-'));
    try {
      const context=inputs();const coverage=deriveCertificationCoverage(context);
      const cells=coverage.expected_cells.map(cell=>({cell_id:cell.cell_id,mandatory:true,status:'PASS',command:'node test-fixture.mjs',provenance_ref:'fixture:synthetic-only',coverage_ref:'declared-inputs'}));
      if(mode==='omitted') cells.splice(0,1);
      if(mode==='skipped') cells[0].status='SKIPPED';
      if(mode==='missing-upstream') cells.splice(cells.findIndex(cell=>cell.cell_id.endsWith('distribution-conformance')),1);
      if(mode==='stale') context.registry_revision='e'.repeat(40);
      writeFileSync(join(directory,'inputs.json'),JSON.stringify(context));
      writeFileSync(join(directory,'results.json'),mode==='malformed-json'?'bad json':JSON.stringify({schema:'titan.certification-results/v1',coverage_key:coverage.coverage_key,cells}));
      const args=['scripts/certify-release.mjs','--inputs',join(directory,'inputs.json'),'--results',join(directory,'results.json'),'--output',join(directory,'evidence.json')];
      const run=spawnSync(process.execPath,args,{encoding:'utf8'});
      assert.equal(run.status,mode==='complete'?0:1,run.stderr);
      const artifact=JSON.parse(readFileSync(join(directory,'evidence.json'),'utf8'));
      assert.equal(artifact.eligibility.eligible,mode==='complete');
      assert.equal(artifact.handoff.authorityGranted,false);
      assert.equal(artifact.handoff.publication_state,'NOT_EVALUATED');
      assert.equal(artifact.handoff.candidate_revision,mode==='malformed-json'?null:context.candidate_revision);
      assert.equal(artifact.handoff.artifact_hash,mode==='malformed-json'?null:context.artifact_hash);
      assert.ok(mode==='complete'||artifact.eligibility.denial_reasons.length>0);
      const first=readFileSync(join(directory,'evidence.json'),'utf8');
      assert.equal(spawnSync(process.execPath,args,{encoding:'utf8'}).status,run.status);
      assert.equal(readFileSync(join(directory,'evidence.json'),'utf8'),first);
    }finally{rmSync(directory,{recursive:true,force:true})}
  });
}
