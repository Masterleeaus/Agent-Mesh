(function(g){'use strict';
const SCHEMA='titan-code.manager.issue-state.v2';
const STATES=Object.freeze(['AVAILABLE','CLAIMED','ACTIVE','VERIFYING','READY','PR_OPEN','MERGED','COMPLETED','BLOCKED','FAILED','SUPERSEDED','REBASE_REQUIRED']);
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function projection(input={}){const L=g.TitanZeroManagerLifecycle;if(!L||typeof L.fromGitHub!=='function')throw new Error('GitHub lifecycle projection unavailable');return L.fromGitHub(input);}
function transition(){throw new Error('LOCAL_STATE_TRANSITION_FORBIDDEN lifecycle is derived from GitHub facts');}
function claim(){throw new Error('LOCAL_CLAIM_FORBIDDEN create the canonical agent/<subgoal-id> GitHub branch atomically');}
g.TitanZeroManagerPacketState=freeze({SCHEMA,STATES,projection,transition,claim,authority:freeze({durableTruth:'github',claim:'git-branch-ref',localMutation:false}),legacyName:'TitanZeroManagerPacketState'});
})(typeof globalThis!=='undefined'?globalThis:this);
