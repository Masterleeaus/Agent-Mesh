(function attachTitanBridgeClient(global){
'use strict';
const DEFAULT_ENDPOINT='http://127.0.0.1:43127/v1/action';
const READ_ACTIONS=new Set(['system.ping','system.capabilities','system.diagnostics','repo.status','repo.files','repo.search','file.read','file.previewWrite','local_ai.health','local_ai.models','local_ai.chat','agent_mesh.snapshot','agent_mesh.health','agent_mesh.events','agent_mesh.capabilities']);
const MUTATION_ACTIONS=new Set(['workspace.approve','repo.branch.create','file.write','command.run','local_ai.pull','agent_mesh.recover_agent','agent_mesh.route_packet']);
function normalizeConfig(input={}){return Object.freeze({enabled:input.enabled!==false,endpoint:String(input.endpoint||DEFAULT_ENDPOINT).trim(),token:String(input.token||'').trim(),workspace:String(input.workspace||'').trim()});}
function publicConfig(config){return Object.freeze({...config,token:config.token?'configured':''});}
function classify(action){if(READ_ACTIONS.has(action))return 'read';if(MUTATION_ACTIONS.has(action))return 'mutation';return 'denied';}
async function call(configInput,action,payload={}){
 const config=normalizeConfig(configInput);if(!config.enabled)return {ok:false,reason:'bridge-disabled'};if(!config.token)return {ok:false,reason:'bridge-token-required',needsPairing:true};const cls=classify(action);if(cls==='denied')return {ok:false,reason:'bridge-action-denied'};
 try{const response=await global.CodeeApprovedNetworkTransport.postJson(config.endpoint,{action,payload},{headers:{Authorization:`Bearer ${config.token}`,'Content-Type':'application/json','X-Request-Id':`codee-${Date.now()}`}});if(!response.ok||response.json?.ok===false)return {ok:false,reason:response.json?.error||`bridge-http-${response.status}`,status:response.status};return {ok:true,result:response.json?.result,classification:response.json?.classification||cls};}catch(error){return {ok:false,reason:String(error?.message||error).slice(0,1000)};}
}
async function status(config){const caps=await call(config,'system.capabilities',{});if(!caps.ok)return {ok:false,connected:false,config:publicConfig(normalizeConfig(config)),reason:caps.reason,needsPairing:caps.needsPairing===true};const [health,models,repo]=await Promise.all([call(config,'local_ai.health',{}),call(config,'local_ai.models',{}),call(config,'repo.status',{})]);return {ok:true,connected:true,config:publicConfig(normalizeConfig(config)),capabilities:caps.result||{},ollama:{health:health.ok?health.result:{ok:false,error:health.reason},models:models.ok?(models.result?.models||[]):[]},repository:repo.ok?repo.result:{ok:false,error:repo.reason}};}
global.CodeeTitanBridgeClient=Object.freeze({DEFAULT_ENDPOINT,normalizeConfig,publicConfig,classify,call,status,READ_ACTIONS:Object.freeze([...READ_ACTIONS]),MUTATION_ACTIONS:Object.freeze([...MUTATION_ACTIONS])});
})(typeof globalThis!=='undefined'?globalThis:this);
