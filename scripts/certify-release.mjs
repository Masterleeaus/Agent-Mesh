#!/usr/bin/env node
// Node >=24. Evidence-only CLI: it never executes commands listed in receipts.
import { readFileSync, writeFileSync } from 'node:fs';
import { evaluateReleaseEligibility } from '../packages/titan-platform/src/certification-matrix.ts';

const args=process.argv.slice(2);
const options=new Map();
let invalid=false;
for(let i=0;i<args.length;i+=2){
  if(!['--inputs','--results','--output'].includes(args[i])||!args[i+1]||options.has(args[i]))invalid=true;
  options.set(args[i],args[i+1]);
}
if(invalid||!options.has('--inputs')||!options.has('--results')||!options.has('--output')){
  console.error('Usage (Node >=24): node scripts/certify-release.mjs --inputs trusted-scope.json --results receipts.json --output readiness.json');
  process.exit(1);
}
let inputs=null;
let eligibility;
try{
  inputs=JSON.parse(readFileSync(options.get('--inputs'),'utf8'));
  const results=JSON.parse(readFileSync(options.get('--results'),'utf8'));
  eligibility=evaluateReleaseEligibility(results,inputs);
}catch{
  inputs=null;
  eligibility=evaluateReleaseEligibility([]);
  eligibility.denial_reasons=[...eligibility.denial_reasons,'input-unreadable-or-malformed'].sort();
}
const artifact={
  schema:'titan.certification-evidence/v1',
  input_revisions:inputs?{
    candidate_revision:inputs.candidate_revision??null, registry_revision:inputs.registry_revision??null,
    scope_revision:inputs.scope_revision??null, compatibility:inputs.compatibility??null,
  }:null,
  eligibility,
  handoff:{
    schema:'titan.certification-handoff/v1',
    candidate_revision:inputs?.candidate_revision??null, artifact_hash:inputs?.artifact_hash??null,
    coverage_key:eligibility.coverage_key, eligible:eligibility.eligible,
    authorityGranted:false, publication_state:'NOT_EVALUATED',
    consumer_contract:'docs/contracts/deployment-release-lifecycle.md',
    consumer_integration:'NOT_IMPLEMENTED',
  },
};
try{writeFileSync(options.get('--output'),JSON.stringify(artifact,null,2)+'\n')}
catch{console.error('Unable to write certification evidence');process.exit(1)}
console.log(eligibility.eligible?'Certification evidence eligible for declared scope; publication and authority are not evaluated.':'Certification denied; inspect denial_reasons in the evidence artifact.');
process.exitCode=eligibility.eligible?0:1;
