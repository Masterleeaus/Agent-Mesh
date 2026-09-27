(function(g){'use strict';
const SCHEMA='titan-zero.manager.dependency-engine.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function arr(v){return Array.isArray(v)?v:[];} function sid(v){return String(v||'');}
function unique(v){return [...new Set(arr(v).map(sid).filter(Boolean))];}
function life(p){const L=g.TitanZeroManagerLifecycle;return L&&typeof L.get==='function'?L.get(p):String(p&&((p.state)||p.status)||'').toUpperCase();}
function depDone(p){const L=g.TitanZeroManagerLifecycle;if(!L||typeof L.dependencySatisfied!=='function')return false;return L.dependencySatisfied(p);}
function derive(packets=[],ctx={}){const list=arr(packets),completedPackets=unique(list.filter(p=>p&&depDone(p)).map(p=>p.packet_id));const done=new Set(completedPackets);const active=arr(ctx.activeClaims).filter(c=>c&&c.status==='ACTIVE');const activeHotspots=unique(active.flatMap(c=>arr(c.exclusive_hotspots)));const byPacket={};
for(const p of list){if(!p||!p.packet_id)continue;const blockers=[];for(const dep of unique(p.dependencies))if(!done.has(dep))blockers.push(`dependency:${dep}`);for(const h of unique(p.exclusive_hotspots))if(activeHotspots.includes(h)&&!active.some(c=>c.packet===p.packet_id))blockers.push(`exclusive-hotspot:${h}`);byPacket[p.packet_id]=freeze({packet_id:p.packet_id,eligible:blockers.length===0,blockers,dependencies:unique(p.dependencies),unmetDependencies:blockers.filter(x=>x.startsWith('dependency:')).map(x=>x.slice(11)),unlockable:blockers.length===0&&life(p)==='AVAILABLE'});}
return freeze({schema:SCHEMA,completedPackets,byPacket});}
function unlocked(before={},after={}){const out=[];for(const [id,v] of Object.entries(after.byPacket||{})){const prev=(before.byPacket||{})[id];if(v.unlockable&&!(prev&&prev.unlockable))out.push(id);}return freeze(out.sort());}
g.TitanZeroManagerDependencyEngine=freeze({SCHEMA,derive,unlocked,authority:freeze({dependencyCompletion:'github-merged-pr-evidence',legacyCompletionMayUnlock:false})});
})(typeof globalThis!=='undefined'?globalThis:this);
