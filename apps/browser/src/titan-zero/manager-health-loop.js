(function attachTitanCodeManagerHealthLoop(global){
'use strict';
const SCHEMA='titan-code.manager-health-loop.v1';
const PRIVATE='PRIVATE TITAN CODE DEVELOPMENT ONLY';
const clone=v=>JSON.parse(JSON.stringify(v==null?{}:v));
const arr=v=>Array.isArray(v)?v:[];
function fingerprint(value){return JSON.stringify(value,(k,v)=>k==='generatedAt'?undefined:v);}
function analyze(snapshot={}, previous={}){
 const sup=global.TitanCodeManagerAISupervisor;
 const inspection=sup&&typeof sup.inspect==='function'?sup.inspect(snapshot):{summary:{},agents:[],risks:[]};
 const agents=inspection.agents||[];
 const history=previous.agentHistory&&typeof previous.agentHistory==='object'?previous.agentHistory:{};
 const repeated=[]; const noProgress=[]; const loopRisks=[];
 for(const a of agents){
  if(!a.id) continue;
  const h=history[a.id]||{errors:[],lastProgress:a.lastProgress,passes:[]};
  const errors=[...arr(h.errors),...(a.lastError?[a.lastError]:[])].slice(-8);
  const same=errors.length>=3&&new Set(errors.map(String)).size===1;
  if(same) repeated.push({agent_id:a.id,error:String(errors[errors.length-1]).slice(0,500),count:errors.length});
  const priorPass=Number(h.lastPass||0), currentPass=Number(a.pass||0);
  if(a.state==='ACTIVE'&&a.lastProgress&&h.lastProgress===a.lastProgress&&currentPass<=priorPass) noProgress.push({agent_id:a.id,reason:'NO_PROGRESS_SIGNAL'});
  const attempts=Number(h.recoveryAttempts||0); if(attempts>=3) loopRisks.push({agent_id:a.id,reason:'RECOVERY_LOOP',attempts});
 }
 const plan=sup&&typeof sup.deterministicPlan==='function'?sup.deterministicPlan({...inspection,risks:[...(inspection.risks||[]),...repeated.map(x=>`repeated-error:${x.agent_id}`),...noProgress.map(x=>`no-progress:${x.agent_id}`),...loopRisks.map(x=>`recovery-loop:${x.agent_id}`)]}):null;
 return Object.freeze({schema:SCHEMA,privateDevelopmentOnly:true,titanZeroRuntimeDependency:false,generatedAt:new Date().toISOString(),inspection,repeatedErrors:repeated,noProgress,noRecoveryLoops:loopRisks,plan,requiresAttention:Boolean(repeated.length||noProgress.length||loopRisks.length||inspection.risks?.length),fingerprint:fingerprint({inspection,repeated,noProgress,loopRisks})});
}
function nextHistory(snapshot={}, previous={}){const sup=global.TitanCodeManagerAISupervisor;const inspection=sup?.inspect?sup.inspect(snapshot):{agents:[]};const out=clone(previous.agentHistory||{});for(const a of inspection.agents||[]){if(!a.id) continue;const h=out[a.id]||{errors:[],recoveryAttempts:0};h.lastProgress=a.lastProgress;h.lastPass=a.pass;if(a.lastError)h.errors=[...arr(h.errors),a.lastError].slice(-8);out[a.id]=h;}return out;}
class ManagerHealthLoop{
 constructor({readSnapshot, onAttention, intervalMs=60000, now=()=>Date.now()}={}){if(typeof readSnapshot!=='function')throw new TypeError('readSnapshot is required');this.readSnapshot=readSnapshot;this.onAttention=typeof onAttention==='function'?onAttention:null;this.intervalMs=Math.max(60000,Number(intervalMs)||60000);this.now=now;this.timer=null;this.state={agentHistory:{},last:null,runs:0};}
 async run(){const snapshot=await this.readSnapshot();const result=analyze(snapshot,this.state);this.state.agentHistory=nextHistory(snapshot,this.state);this.state.last=result;this.state.runs++;if(result.requiresAttention&&this.onAttention)await this.onAttention(result);return result;}
 start(){if(this.timer)return false;this.timer=setInterval(()=>this.run().catch(()=>{}),this.intervalMs);return true;}
 stop(){if(!this.timer)return false;clearInterval(this.timer);this.timer=null;return true;}
 status(){return Object.freeze({schema:SCHEMA,running:Boolean(this.timer),intervalMs:this.intervalMs,runs:this.state.runs,last:this.state.last,privateDevelopmentOnly:true,titanZeroRuntimeDependency:false});}
}
global.TitanCodeManagerHealthLoop=Object.freeze({SCHEMA,PRIVATE,analyze,nextHistory,ManagerHealthLoop,status:()=>({schema:SCHEMA,installed:true})});
})(typeof globalThis!=='undefined'?globalThis:this);
