(function(g){'use strict';
const SCHEMA='titan-zero.manager.live-state.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function reconcile(input={}){const drift=[];const p=input.packet||{},c=input.claim||{},a=input.agent||{};if(p.packet_id&&c.packet&&p.packet_id!==c.packet)drift.push('packet-claim-id-mismatch');if(c.packet&&a.current_work_packet&&c.packet!==a.current_work_packet)drift.push('claim-agent-packet-mismatch');if(p.status==='AVAILABLE'&&['ACTIVE','CLAIMED'].includes(c.status))drift.push('packet-claims-state-drift');if(c.status==='ACTIVE'&&a.status&&a.status!=='ACTIVE')drift.push('claim-agent-status-drift');return freeze({schema:SCHEMA,status:drift.length?'STATE_DRIFT_DETECTED':'CONSISTENT',drift,failClosed:drift.length>0});}
g.TitanZeroManagerLiveState=freeze({SCHEMA,reconcile});
})(typeof globalThis!=='undefined'?globalThis:this);
