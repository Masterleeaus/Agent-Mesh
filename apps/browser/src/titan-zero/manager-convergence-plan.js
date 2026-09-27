(function(g){'use strict';
const SCHEMA='titan-zero.manager.convergence-plan.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function build(input={}){if(!input.intake)throw new Error('intake required');const engine=g.TitanZeroManagerDeltaConvergence;if(!engine)throw new Error('delta convergence engine unavailable');const decision=engine.decide(input);const ready=decision.decision!=='BLOCKED'&&decision.decision!=='REIMPLEMENT_REQUIRED'&&input.regressionPassed===true;return freeze({schema:SCHEMA,packetId:input.intake.packetId,deltaSha256:input.intake.deltaSha256,baseSha256:input.intake.baseSha256,decision:decision.decision,reason:decision.reason||null,regressionPassed:input.regressionPassed===true,readyForPromotionGate:ready,requiredAction:decision.decision==='CLEAN_FORWARD_PORT'?'APPLY_TRUE_DELTA':decision.decision==='SEMANTIC_REBASE'?'SEMANTIC_REBASE':decision.decision==='REIMPLEMENT_REQUIRED'?'REIMPLEMENT_REQUIRED':'BLOCKED'});}
g.TitanZeroManagerConvergencePlan=freeze({SCHEMA,build});
})(typeof globalThis!=='undefined'?globalThis:this);
