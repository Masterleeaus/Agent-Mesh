(function attachTitanZeroManagerControlPlane(global){
'use strict';
const SCHEMA='titan-zero.manager.control-plane.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
const topology=global.TitanZeroAgentMeshRoleTopology;
if(!topology) throw new Error('Titan Zero Manager control plane requires role topology');
const MANAGER_IDENTITY=freeze({surface:'titan-code',role:'manager',authority:'canonical-manager'});
const protectedCapabilities=freeze(['canonical.promote','merge.execute','packet.assign','dependency.manage','delta.process','cleanup.eligibility.mark']);
function can(roleId,capability){return topology.can(roleId,capability);}
function isCanonicalManager(identity={}){return identity&&identity.surface===MANAGER_IDENTITY.surface&&identity.role===MANAGER_IDENTITY.role&&identity.authority===MANAGER_IDENTITY.authority;}
function authorize(input={}){
 const role=String(input.role||''); const capability=String(input.capability||'');
 if(!can(role,capability)) throw new Error(`${role||'unknown'} is not authorized for ${capability||'unknown capability'}`);
 if(protectedCapabilities.includes(capability)&&role!=='manager') throw new Error(`${role} is not authorized for protected Manager capability ${capability}`);
 return freeze({schema:SCHEMA,authorized:true,role,capability,managerBoundary:protectedCapabilities.includes(capability)});
}
function assertBoundary(){const violations=[];for(const cap of protectedCapabilities){if(!can('manager',cap))violations.push(`manager-missing:${cap}`);for(const r of ['supervisor','librarian','builder','browserIntelligence'])if(can(r,cap))violations.push(`${r}-has-protected:${cap}`);}if(!topology.assertSeparation().ok)violations.push(...topology.assertSeparation().violations);return freeze({ok:violations.length===0,violations});}
const api=freeze({SCHEMA,MANAGER_IDENTITY,protectedCapabilities,can,isCanonicalManager,authorize,assertBoundary});
if(!api.assertBoundary().ok) throw new Error('Titan Zero Manager authority boundary invalid');
global.TitanZeroManagerControlPlane=api;
})(typeof globalThis!=='undefined'?globalThis:this);
