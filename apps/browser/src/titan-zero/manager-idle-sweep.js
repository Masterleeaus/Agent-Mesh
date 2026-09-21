(function(g){'use strict';
const SCHEMA='titan-zero.manager.idle-sweep.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function arr(v){return Array.isArray(v)?v:[];}
function clone(v){return JSON.parse(JSON.stringify(v==null?{}:v));}
function slugAgent(name){return String(name||'AGENT').toUpperCase().replace(/[^A-Z0-9]+/g,'').replace(/^AGENT/,'AGENT');}
function nextMaintId(d,agentName){const prefix=`TC-MAINT-${slugAgent(agentName)}-`;let max=0;for(const p of arr(d.packets)){const id=String(p&&p.packet_id||'');if(id.startsWith(prefix)){const n=Number(id.slice(prefix.length));if(Number.isInteger(n))max=Math.max(max,n);}}return `${prefix}${String(max+1).padStart(3,'0')}`;}
function defaultMaintenanceFactory(d,agentName,agent){const templates=arr(d.maintenance_queue&&d.maintenance_queue.templates);if(!templates.length)return null;const used=new Map();for(const p of arr(d.packets)){if(p&&p.maintenance_template)used.set(p.maintenance_template,(used.get(p.maintenance_template)||0)+1);}const scored=templates.map((t,i)=>({t,i,n:used.get(t)||0})).sort((a,b)=>a.n-b.n||a.i-b.i);const template=scored[0]&&scored[0].t;if(!template)return null;return {packet_id:nextMaintId(d,agentName),title:`Maintenance: ${template}`,maintenance_template:template,priority:'P2',status:'AVAILABLE',state:'AVAILABLE',owner_lane:String(agent&&agent.lane||''),allowed_lanes:[String(agent&&agent.lane||'')],size:'S',passes:3,created_by:'Titan Code Manager idle sweep',safe_maintenance:true,exclusive_hotspots:[],completion_gate:'standard packet completion gate'};}
function sweep(current,expectedRevision,opts={}){
 const L=g.TitanZeroManagerWorkspaceLedger,C=g.TitanZeroManagerSelfClaim;if(!L||!C)throw new Error('idle sweep dependencies unavailable');
 const now=opts.updated_at||new Date().toISOString();
 return L.commit(current,expectedRevision,d=>{
   const dependencyState=opts.dependencyState||{byPacket:{}};const claimedPackets=new Set(arr(d.claims).filter(c=>c&&['CLAIMED','ACTIVE','VERIFYING','READY','CONVERGENCE_PENDING','REBASE_REQUIRED'].includes(c.state||c.status)).map(c=>String(c.packet||c.packet_id||'')));
   const assignments=[];
   for(const agentName of Object.keys(d.agents||{}).sort()){
     const agent=d.agents[agentName];if(!agent||agent.state!=='AVAILABLE'||agent.execution_active)continue;
     if(Number(agent.working_generation)!==Number(d.generation)){agent.state='REBASE_REQUIRED';agent.rebase_required=true;agent.target_generation=d.generation;agent.next_action=`Rebase onto canonical generation ${d.generation}, then resume automatic claim evaluation.`;continue;}
     const liveClaims=arr(d.claims).filter(c=>!c||!claimedPackets.has(String(c.packet||c.packet_id||''))||String(c.agent)!==agentName);
     let pick=C.select(clone(agent),clone(d.packets),{claims:clone(liveClaims),dependencyState:clone(dependencyState)});let selected=pick.selected?arr(d.packets).find(p=>p&&p.packet_id===pick.selected.packet_id):null;
     if(!selected){const f=opts.maintenanceFactory||defaultMaintenanceFactory;const created=f(d,agentName,agent);if(created){d.packets.push(created);selected=created;}}
     if(!selected){agent.next_action='No eligible roadmap or predefined maintenance work exists. Re-evaluate automatically on the next ledger mutation.';continue;}
     selected.status='ACTIVE';selected.state='ACTIVE';selected.claimed_by=agentName;selected.claimed_at=now;claimedPackets.add(String(selected.packet_id));
     const claim=C.claim(agentName,agent,selected,expectedRevision+1,d.generation);d.claims.push(Object.assign({},claim,{state:'ACTIVE',status:'ACTIVE'}));
     agent.state='ACTIVE';agent.current_work_packet=selected.packet_id;agent.current_pass=1;agent.passes_complete=0;agent.execution_active=true;agent.rebase_required=false;agent.target_generation=d.generation;agent.next_action=`Begin ${selected.packet_id} Pass 1 immediately; no Manager routing required.`;agent.last_progress_summary=`Manager idle sweep self-claimed ${selected.packet_id} automatically.`;
     assignments.push({agent:agentName,packet:selected.packet_id,maintenance:!!selected.safe_maintenance});
   }
   d.history=d.history&&typeof d.history==='object'?d.history:{};d.history.manager_events=arr(d.history.manager_events);d.history.manager_events.push({event:'MANAGER_IDLE_SWEEP',at:now,assignments,available_agents_left:Object.entries(d.agents||{}).filter(([,a])=>a&&a.state==='AVAILABLE').map(([n])=>n)});return d;
 },{updated_by:opts.updated_by||'Titan Code Manager / idle sweep',updated_at:now});
}
g.TitanZeroManagerIdleSweep=freeze({SCHEMA,sweep,defaultMaintenanceFactory});
})(typeof globalThis!=='undefined'?globalThis:this);
