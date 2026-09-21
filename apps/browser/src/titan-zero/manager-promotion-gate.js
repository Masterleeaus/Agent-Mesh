(function(g){'use strict';
const SCHEMA='titan-zero.manager.promotion-gate.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function evaluate(input={}){const required=['managerAuthorized','identityValid','ancestryValid','hashValid','dependenciesSatisfied','hotspotsResolved','supervisorVerified','regressionPassed','reconstructionVerified'];const failed=required.filter(k=>input[k]!==true);if(input.stateDrift)failed.push('stateDrift');return freeze({schema:SCHEMA,allowed:failed.length===0,failed:[...new Set(failed)],action:failed.length?'PROMOTION_BLOCKED':'CANONICAL_PROMOTION_ALLOWED'});}
g.TitanZeroManagerPromotionGate=freeze({SCHEMA,evaluate});
})(typeof globalThis!=='undefined'?globalThis:this);
