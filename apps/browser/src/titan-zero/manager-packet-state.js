(function(g){'use strict';
const SCHEMA='titan-zero.manager.packet-state.v1';
const STATES=Object.freeze(['AVAILABLE','CLAIMED','ACTIVE','READY_FOR_MANAGER_MERGE','BLOCKED','DONE']);
const NEXT=Object.freeze({AVAILABLE:['CLAIMED','BLOCKED'],CLAIMED:['ACTIVE','BLOCKED'],ACTIVE:['READY_FOR_MANAGER_MERGE','BLOCKED'],READY_FOR_MANAGER_MERGE:['DONE','BLOCKED'],BLOCKED:['AVAILABLE','CLAIMED'],DONE:[]});
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function transition(from,to){if(!STATES.includes(from)||!STATES.includes(to))throw new Error('invalid packet state');if(!NEXT[from].includes(to))throw new Error(`invalid packet transition ${from}->${to}`);return freeze({schema:SCHEMA,from,to});}
function claim(packet={},agent){if(packet.status!=='AVAILABLE')throw new Error('packet not available');if(!String(agent||'').trim())throw new Error('agent required');return freeze({...packet,status:'CLAIMED',owner:String(agent).trim()});}
g.TitanZeroManagerPacketState=freeze({SCHEMA,STATES,NEXT,transition,claim});
})(typeof globalThis!=='undefined'?globalThis:this);
