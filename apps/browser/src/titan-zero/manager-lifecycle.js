(function(g){'use strict';
const SCHEMA='titan-zero.manager.lifecycle.v1';
const CANONICAL=Object.freeze(['AVAILABLE','CLAIMED','ACTIVE','VERIFYING','READY','CONVERGENCE_PENDING','MERGED','PROMOTED','BLOCKED','FAILED','SUPERSEDED','REBASE_REQUIRED']);
const LEGACY=Object.freeze({DONE:'MERGED'});
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function norm(v){const raw=String(v||'').trim().toUpperCase();return LEGACY[raw]||raw;}
function get(record={}){const state=norm(record&&record.state);if(state)return state;return norm(record&&record.status);}
function dependencySatisfied(record={}){const lifecycle=get(record);return lifecycle==='MERGED'||lifecycle==='PROMOTED';}
function is(record,state){return get(record)===norm(state);}
function withState(record={},state){const out={...(record||{})};out.state=norm(state);return out;}
g.TitanZeroManagerLifecycle=freeze({SCHEMA,CANONICAL,LEGACY,get,is,withState,dependencySatisfied,normalizeValue:norm});
})(typeof globalThis!=='undefined'?globalThis:this);
