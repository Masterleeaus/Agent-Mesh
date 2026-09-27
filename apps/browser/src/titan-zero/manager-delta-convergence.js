(function(g){'use strict';
const SCHEMA='titan-zero.manager.delta-convergence.v1';
const STAGES=Object.freeze(['DELTA_RECEIVED','IDENTITY_CHECK','BASE_ANCESTRY_CHECK','HASH_VALIDATION','HOTSPOT_COLLISION_CHECK','DEPENDENCY_CHECK','SUPERVISOR_VERIFICATION','CONVERGENCE_DECISION','TEST_REGRESSION','CANONICAL_PROMOTION']);
const DECISIONS=Object.freeze(['CLEAN_FORWARD_PORT','SEMANTIC_REBASE','REIMPLEMENT_REQUIRED','BLOCKED']);
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function decide(input={}){if(!input.identityValid||!input.hashValid||!input.dependenciesSatisfied)return freeze({schema:SCHEMA,decision:'BLOCKED',reason:'hard-gate-failed'});if(input.supervisorVerdict!=='PASS')return freeze({schema:SCHEMA,decision:'BLOCKED',reason:'supervisor-verification-required'});if(input.baseMatches&& !input.hotspotCollision)return freeze({schema:SCHEMA,decision:'CLEAN_FORWARD_PORT'});if(input.ancestryCompatible&&!input.semanticConflict)return freeze({schema:SCHEMA,decision:'SEMANTIC_REBASE'});return freeze({schema:SCHEMA,decision:'REIMPLEMENT_REQUIRED'});}
g.TitanZeroManagerDeltaConvergence=freeze({SCHEMA,STAGES,DECISIONS,decide});
})(typeof globalThis!=='undefined'?globalThis:this);
