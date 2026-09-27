(function(g){'use strict';
const SCHEMA='titan-zero.manager.baseline-advance-candidate.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function clean(v,max=512){return String(v||'').trim().slice(0,max);}
function sha(v){const s=clean(v,64).toLowerCase();if(!/^[a-f0-9]{64}$/.test(s))throw new Error('valid sha256 required');return s;}
function create(input={}){const current=sha(input.currentBaselineSha256), candidate=sha(input.candidateSha256), parent=sha(input.parentSha256);if(parent!==current)throw new Error('candidate parent must equal current baseline');const allowed=!!(input.promotionGate&&input.promotionGate.allowed===true&&input.supervisorVerdict==='PASS'&&input.regressionPassed===true&&input.reconstructionVerified===true&&['CLEAN_FORWARD_PORT','SEMANTIC_REBASE'].includes(input.convergenceDecision));return freeze({schema:SCHEMA,currentBaselineSha256:current,candidateSha256:candidate,parentSha256:parent,artifact:clean(input.artifact,512),convergenceDecision:clean(input.convergenceDecision,64),supervisorVerdict:clean(input.supervisorVerdict,64),regressionPassed:input.regressionPassed===true,reconstructionVerified:input.reconstructionVerified===true,status:allowed?'READY_FOR_COORDINATOR_PROMOTION':'BLOCKED',canonical:false,coordinatorPromotionRequired:true});}
g.TitanZeroManagerBaselineAdvance=freeze({SCHEMA,create});
})(typeof globalThis!=='undefined'?globalThis:this);
