(function attachTitanZeroAgentMeshRoleTopology(global){
'use strict';

const SCHEMA='titan-zero.agent-mesh.role-topology.v1';
const CANONICAL_AUTHORITY='manager';
const EXTERNAL_INDEPENDENT_ROLES=Object.freeze(['supervisor','librarian']);

function freeze(value){
  if(!value||typeof value!=='object'||Object.isFrozen(value)) return value;
  Object.freeze(value);
  for(const key of Object.keys(value)) freeze(value[key]);
  return value;
}
function role(surface,authority,allowed,forbidden,notes=[]){
  return freeze({surface,authority,allowed:[...allowed],forbidden:[...forbidden],notes:[...notes]});
}

const roles=freeze({
  manager:role('titan-code','canonical-manager',[
    'packet.assign','dependency.manage','delta.process','merge.execute','canonical.promote',
    'supervisor.verify.request','cleanup.eligibility.mark'
  ],[
    'supervisor.verdict.fabricate','builder.active-work.overwrite','artifact.unresolved.delete','verification.required.bypass'
  ],['Persistent operational Manager runtime for Titan Zero development.']),
  supervisor:role('chatgpt','independent-verification',[
    'verification.inspect','verification.challenge','verification.verdict','scan.request','remediation.require','conflict.raise'
  ],[
    'canonical.promote','merge.execute','packet.claim','cleanup.decide','manager.verdict.fabricate'
  ],['External independent oversight surface.']),
  librarian:role('chatgpt','independent-lineage-cleanup',[
    'cleanup.decide','lineage.consolidate','supersession.review','reconstruction.verify','cleanup.conflict.raise'
  ],[
    'canonical.promote','merge.execute','packet.claim','verification.verdict','manager.verdict.fabricate'
  ],['External independent lineage and cleanup authority.']),
  builder:role('agent-mesh-builder','claimed-scope-implementation',[
    'implementation.execute','delta.publish','verification.evidence.publish','handoff.publish'
  ],[
    'canonical.promote','merge.execute','packet.steal','active-work.overwrite','supervisor.verdict.fabricate','cleanup.decide'
  ],['May implement only within a valid claimed packet and dependency/hotspot gates.']),
  browserIntelligence:role('titan-code','advisory-only',[
    'analysis.propose','risk.classify','dependency.reason','summary.prepare','recommendation.prepare'
  ],[
    'canonical.promote','merge.execute','repository.mutate.authorize','shell.execute.authorize','verification.verdict','cleanup.decide'
  ],['Model reasoning remains advisory unless a governed Manager action separately authorizes an effect.'])
});

function has(list,capability){return list.includes(String(capability||''));}
function can(roleId,capability){
  const r=roles[String(roleId||'')];
  if(!r) return false;
  const cap=String(capability||'');
  if(has(r.forbidden,cap)) return false;
  return has(r.allowed,cap);
}
function assertSeparation(){
  const violations=[];
  if(!can('manager','canonical.promote')) violations.push('manager-missing-canonical-authority');
  for(const roleId of ['supervisor','librarian','builder','browserIntelligence']){
    if(can(roleId,'canonical.promote')) violations.push(`${roleId}-may-promote-canonical`);
  }
  if(!can('supervisor','verification.challenge')) violations.push('supervisor-cannot-challenge');
  if(!can('librarian','cleanup.decide')) violations.push('librarian-cannot-decide-cleanup');
  if(can('manager','supervisor.verdict.fabricate')) violations.push('manager-may-fabricate-supervisor-verdict');
  return freeze({ok:violations.length===0,violations});
}
function describe(){
  return freeze({
    schema:SCHEMA,
    canonicalAuthority:CANONICAL_AUTHORITY,
    externalIndependentRoles:[...EXTERNAL_INDEPENDENT_ROLES],
    roles
  });
}

const api=freeze({SCHEMA,CANONICAL_AUTHORITY,EXTERNAL_INDEPENDENT_ROLES,roles,can,assertSeparation,describe});
if(!api.assertSeparation().ok) throw new Error('Titan Zero Agent Mesh role topology violates separation of duties');
global.TitanZeroAgentMeshRoleTopology=api;
})(typeof globalThis!=='undefined'?globalThis:this);
