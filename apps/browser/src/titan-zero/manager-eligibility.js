(function(g){'use strict';
const SCHEMA='titan-zero.manager.eligibility.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function set(v){return new Set(Array.isArray(v)?v.map(String):[]);}
function overlap(a,b){const bs=set(b);return [...set(a)].filter(x=>bs.has(x));}
function evaluate(packet={},ctx={}){const blockers=[];const deps=Array.isArray(packet.dependencies)?packet.dependencies:[];const done=set(ctx.completedPackets).size?set(ctx.completedPackets):set(ctx.githubCompletedPackets);for(const dep of deps)if(!done.has(String(dep)))blockers.push(`dependency:${dep}`);const exclusive=overlap(packet.exclusive_hotspots,ctx.activeExclusiveHotspots);for(const h of exclusive)blockers.push(`exclusive-hotspot:${h}`);const shared=overlap(packet.shared_hotspots,ctx.activeSharedHotspots);const githubBacked=ctx.authority?.durableTruth==='github'||ctx.github===true;return freeze({schema:SCHEMA,eligible:githubBacked&&blockers.length===0,blockers,coordinationRequired:shared.length>0,sharedHotspotOverlap:shared,authority:{dependencyEvidence:githubBacked?'github':'none',mayUnlock:githubBacked&&blockers.length===0}});}
g.TitanZeroManagerEligibility=freeze({SCHEMA,evaluate,overlap});
})(typeof globalThis!=='undefined'?globalThis:this);
