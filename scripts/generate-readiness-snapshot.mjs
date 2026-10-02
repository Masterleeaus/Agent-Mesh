#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const inputPath='tests/e2e/certification/release-readiness.audit.json';
const outputPath='tests/e2e/certification/release-readiness-matrix.generated.json';

/** A commit-bound source audit renderer, never an eligibility/registry producer. */
export function generateReadinessSnapshot(audit){
 if(audit.schema!=='titan.readiness-audit-input/v1'||!/^[a-f0-9]{40}$/.test(audit.source_commit))throw new Error('audit-schema-or-revision-invalid');
 if(audit.audit_completeness!=='PARTIAL'||audit.production_eligibility!=='DENIED_MISSING_EVIDENCE'||audit.published_state!=='UNKNOWN')throw new Error('source-audit-cannot-certify');
 if(!Array.isArray(audit.subsystems)||!audit.subsystems.length)throw new Error('audit-rows-required');
 const seen=new Set();
 const subsystems=audit.subsystems.map(row=>{
  if(!row.subsystem_id||seen.has(row.subsystem_id))throw new Error('audit-row-identity-invalid');
  seen.add(row.subsystem_id);
  if(row.assessment_status!=='INCOMPLETE'||row.source_evidence!=='SOURCE_INSPECTED'||row.test_evidence.status!=='NOT_RUN'||row.integration_evidence.status!=='NOT_RUN'||row.deployment_evidence.status!=='NOT_RUN'||row.runtime_evidence.status!=='UNKNOWN')throw new Error('source-audit-cannot-certify');
  if(!row.missing_requirements?.length||!row.canonical_owner_refs?.length||!row.implementation_paths?.length)throw new Error('audit-evidence-required');
  const sources=[...row.implementation_paths].sort().map(path=>{
   if(typeof path!=='string'||path.startsWith('/')||path.split('/').includes('..'))throw new Error('source-path-invalid');
   const bytes=execFileSync('git',['show',`${audit.source_commit}:${path}`],{maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']});
   return {path,source_commit:audit.source_commit,content_hash:`sha256:${createHash('sha256').update(bytes).digest('hex')}`,kind:'SOURCE_INSPECTED',url:`https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/blob/${audit.source_commit}/${path}`};
  });
  return {...row,implementation_paths:[...row.implementation_paths].sort(),sources};
 }).sort((a,b)=>a.subsystem_id<b.subsystem_id?-1:a.subsystem_id>b.subsystem_id?1:0);
 return {...audit,schema:'titan.release-readiness-audit/v1',generator:'scripts/generate-readiness-snapshot.mjs',authorityGranted:false,eligibility_input:false,subsystems};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const serialized=JSON.stringify(generateReadinessSnapshot(JSON.parse(readFileSync(inputPath,'utf8'))),null,2)+'\n';
  if(process.argv.includes('--check')){
   if(readFileSync(outputPath,'utf8')!==serialized)throw new Error('readiness-snapshot-stale');
   console.log('Commit-bound source audit snapshot matches; production eligibility remains denied.');
  }else{writeFileSync(outputPath,serialized);console.log(outputPath)}
 }catch(error){console.error(error.message);process.exitCode=1}
}
