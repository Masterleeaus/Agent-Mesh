(function(g){'use strict';
const SCHEMA='titan-zero.manager.github-merge-gate.v2';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function evaluate(input={}){const required=['identityValid','ancestryValid','dependenciesSatisfied','hotspotsResolved','supervisorVerified','regressionPassed','reconstructionVerified','prOpen','checksPassed','reviewApproved'];const failed=required.filter(k=>input[k]!==true);if(input.stateDrift)failed.push('stateDrift');if(input.prDraft===true)failed.push('prDraft');if(input.mergeConflict===true)failed.push('mergeConflict');return freeze({schema:SCHEMA,allowed:failed.length===0,failed:[...new Set(failed)],action:failed.length?'GITHUB_MERGE_BLOCKED':'GITHUB_PR_MERGE_ALLOWED',authority:{merge:'github-pr-merge',managerAI:false,localRepositoryAuthority:false}});}
g.TitanZeroManagerPromotionGate=freeze({SCHEMA,evaluate});
})(typeof globalThis!=='undefined'?globalThis:this);
