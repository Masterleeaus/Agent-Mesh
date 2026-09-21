(function(g){'use strict';
const SCHEMA='titan-zero.manager.delta-intake.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function clean(v,max=512){return String(v||'').trim().slice(0,max);}
function sha(v){const s=clean(v,64).toLowerCase();if(!/^[a-f0-9]{64}$/.test(s))throw new Error('valid sha256 required');return s;}
function create(input={}){const files=[...new Set((input.changedFiles||[]).map(x=>clean(x,512)).filter(Boolean))].sort();return freeze({schema:SCHEMA,packetId:clean(input.packetId,128),agent:clean(input.agent,128),deltaSha256:sha(input.deltaSha256),baseSha256:sha(input.baseSha256),changedFiles:files,verificationResult:clean(input.verificationResult,64)||'UNKNOWN',receivedAt:clean(input.receivedAt,64)||null});}
g.TitanZeroManagerDeltaIntake=freeze({SCHEMA,create});
})(typeof globalThis!=='undefined'?globalThis:this);
