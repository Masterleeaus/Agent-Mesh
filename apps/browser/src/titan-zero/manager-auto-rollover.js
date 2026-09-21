(function(g){'use strict';
const SCHEMA='titan-zero.manager.auto-rollover.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function arr(v){return Array.isArray(v)?v:[];}
function clone(v){return JSON.parse(JSON.stringify(v==null?{}:v));}
function packetIdOf(c){return String(c&& (c.packet||c.packet_id) ||'');}
function findPacket(list,id){return arr(list).find(p=>p&&String(p.packet_id)===String(id))||null;}
function rollover(current,expectedRevision,agentName,completedPacketId,opts={}){
  const L=g.TitanZeroManagerWorkspaceLedger,C=g.TitanZeroManagerSelfClaim;
  if(!L||!C)throw new Error('manager rollover dependencies unavailable');
  const now=opts.updated_at||new Date().toISOString();
  const agentKey=String(agentName||'');
  const completedId=String(completedPacketId||'');
  if(!agentKey||!completedId)throw new Error('agent and completed packet required');
  return L.commit(current,expectedRevision,d=>{
    const agent=d.agents&&d.agents[agentKey];
    if(!agent)throw new Error(`unknown agent ${agentKey}`);
    L.assertGeneration(d,agent.working_generation);
    const completed=findPacket(d.packets,completedId);
    if(!completed)throw new Error(`unknown completed packet ${completedId}`);
    const activeClaim=arr(d.claims).find(c=>c&&String(c.agent)===agentKey&&packetIdOf(c)===completedId);
    if(!activeClaim)throw new Error(`completion claim mismatch agent=${agentKey} packet=${completedId}`);

    completed.status='CONVERGENCE_PENDING';
    completed.state='CONVERGENCE_PENDING';
    completed.completed_by=agentKey;
    completed.completed_at=now;
    completed.handoff=completed.handoff&&typeof completed.handoff==='object'?completed.handoff:{};
    completed.handoff.state='CONVERGENCE_PENDING';
    completed.handoff.target='Titan Code Manager';
    completed.handoff.builder_wait_required=false;
    activeClaim.state='CONVERGENCE_PENDING';
    activeClaim.status='CONVERGENCE_PENDING';
    activeClaim.completed_at=now;
    activeClaim.builder_released=true;

    const remainingClaims=arr(d.claims).filter(c=>!(c&&String(c.agent)===agentKey&&packetIdOf(c)===completedId));
    const dependencyState=opts.dependencyState||{byPacket:{}};
    const pick=C.select(clone(agent),clone(d.packets),{claims:clone(remainingClaims),dependencyState:clone(dependencyState)});
    let selected=pick.selected ? findPacket(d.packets,pick.selected.packet_id) : null;
    if(!selected && typeof opts.maintenanceFactory==='function'){
      const created=opts.maintenanceFactory(clone(d),agentKey,clone(agent));
      if(created&&created.packet_id){d.packets.push(created);selected=created;}
    }
    if(selected){
      selected.status='ACTIVE';selected.state='ACTIVE';selected.claimed_by=agentKey;selected.claimed_at=now;
      const newClaim=C.claim(agentKey,agent,selected,expectedRevision+1,d.generation);
      d.claims.push(Object.assign({},newClaim,{state:'ACTIVE',status:'ACTIVE'}));
      agent.state='ACTIVE';agent.current_work_packet=selected.packet_id;agent.current_pass=1;agent.passes_complete=0;agent.execution_active=true;agent.next_action=`Begin ${selected.packet_id} immediately. Do not wait for Manager review of ${completedId}.`;agent.last_completed_packet=completedId;agent.last_progress_summary=`${completedId} entered CONVERGENCE_PENDING; ${selected.packet_id} self-claimed atomically in the same ledger revision.`;
    }else{
      agent.state='AVAILABLE';agent.current_work_packet=null;agent.current_pass=null;agent.execution_active=false;agent.last_completed_packet=completedId;agent.next_action='No eligible roadmap or predefined maintenance packet exists. Re-evaluate eligibility on the next ledger change; Manager routing is not required.';
    }
    d.history=d.history&&typeof d.history==='object'?d.history:{};d.history.manager_events=arr(d.history.manager_events);d.history.manager_events.push({event:'PACKET_COMPLETE_AUTO_ROLLOVER',at:now,agent:agentKey,completed_packet:completedId,next_packet:selected?selected.packet_id:null,builder_waited_for_manager:false,completed_packet_convergence_continues:true});
    return d;
  },{updated_by:opts.updated_by||`${agentKey} / automatic rollover`,updated_at:now});
}
g.TitanZeroManagerAutoRollover=freeze({SCHEMA,rollover});
})(typeof globalThis!=='undefined'?globalThis:this);
