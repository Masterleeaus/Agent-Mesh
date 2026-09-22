(function(g){'use strict';
const SCHEMA='titan-code.manager.lifecycle.v2';
const CANONICAL=Object.freeze(['AVAILABLE','CLAIMED','ACTIVE','VERIFYING','READY','PR_OPEN','MERGED','COMPLETED','BLOCKED','FAILED','SUPERSEDED','REBASE_REQUIRED']);
const LEGACY=Object.freeze({DONE:'MERGED',CONVERGENCE_PENDING:'PR_OPEN',PROMOTED:'MERGED',READY_FOR_MANAGER_MERGE:'READY'});
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function norm(v){const raw=String(v||'').trim().toUpperCase();return LEGACY[raw]||raw;}
function get(record={}){const state=norm(record&&record.state);if(state)return state;return norm(record&&record.status);}
function dependencySatisfied(record={}){const lifecycle=get(record),source=String(record?.source||record?.authority?.durableTruth||'');const githubBacked=source==='github'||source==='github-pr-merge'||record?.github?.authority?.durableTruth==='github';return githubBacked&&(lifecycle==='MERGED'||lifecycle==='COMPLETED');}
function is(record,state){return get(record)===norm(state);}
function withState(record={},state){const next=norm(state);if(next==='MERGED'||next==='COMPLETED')throw new Error('MERGED/COMPLETED lifecycle must be derived from GitHub merged-PR evidence');const out={...(record||{})};out.state=next;return out;}
function fromGitHub(input={}){const D=g.TitanCodeManagerGitHubState;if(!D||typeof D.derive!=='function')throw new Error('github-state projection unavailable');return D.derive(input);}
g.TitanZeroManagerLifecycle=freeze({SCHEMA,CANONICAL,LEGACY,get,is,withState,dependencySatisfied,normalizeValue:norm,fromGitHub,authority:freeze({durableTruth:'github',localLifecycleProjectionOnly:true})});
})(typeof globalThis!=='undefined'?globalThis:this);
