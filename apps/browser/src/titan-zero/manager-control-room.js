(function(g){'use strict';
const SCHEMA='titan-zero.manager.control-room.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function project(input={}){const claims=Array.isArray(input.claims)?input.claims:[];const deltas=Array.isArray(input.deltas)?input.deltas:[];const findings=Array.isArray(input.supervisorFindings)?input.supervisorFindings:[];const drift=Array.isArray(input.drift)?input.drift:[];return freeze({schema:SCHEMA,baselineSha256:String(input.baselineSha256||''),activeClaims:claims.filter(x=>x&&x.status==='ACTIVE').length,pendingDeltas:deltas.filter(x=>x&&x.status!=='DONE').length,openSupervisorFindings:findings.filter(x=>x&&x.status!=='CLOSED').length,stateDriftCount:drift.length,health:drift.length||findings.some(x=>x&&x.severity==='BLOCKING')?'ATTENTION_REQUIRED':'HEALTHY'});}
g.TitanZeroManagerControlRoom=freeze({SCHEMA,project});
})(typeof globalThis!=='undefined'?globalThis:this);
