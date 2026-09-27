(function attachDeploymentWorkforceConsole(global){
'use strict';
const CONFIG_KEY='codeeTitanWorkforceGatewayConfigV1';
const DETAIL_OPS=Object.freeze(['deployment.mission.get','deployment.intake.get','deployment.discovery.get','deployment.questions.get','deployment.participation.get','deployment.evidence.list','deployment.readiness.get','deployment.engineering.get','deployment.installation.get','deployment.commissioning.get','deployment.handover.get','deployment.change_request.list','deployment.receipts.list']);
async function rawConfig(){if(!global.chrome?.storage?.local)return {};const row=await global.chrome.storage.local.get([CONFIG_KEY]);return row?.[CONFIG_KEY]||{};}
async function getConfig(){return global.CodeeTitanWorkforceGateway.normalizeConfig(await rawConfig());}
async function updateConfig(next={}){const current=await rawConfig();const normalized=global.CodeeTitanWorkforceGateway.normalizeConfig({...current,...next});if(global.chrome?.storage?.local)await global.chrome.storage.local.set({[CONFIG_KEY]:normalized});return normalized;}
async function selectedState(config){const state=config.company_id?await global.CodeeDeploymentConsoleStore.load(config.company_id):{company_id:'',selected_mission_id:null,missions:[],projections:{},receipts:[],pending_requests:[],updated_at:null};return {config:global.CodeeTitanWorkforceGateway.publicConfig(config),state,summary:global.CodeeDeploymentConsoleStore.summary(state)};}
async function invoke(config,operation,options={}){
 const request=global.CodeeTitanWorkforceGateway.createRequest({...options,company_id:config.company_id,actor_id:config.actor_id,operation,payload:options.payload||{}});
 await global.CodeeDeploymentConsoleStore.recordRequest(config.company_id,request);
 try{
  const result=await global.CodeeTitanWorkforceGateway.send(config,request);
  await global.CodeeDeploymentConsoleStore.recordReceipt(config.company_id,result.receipt);
  await global.CodeeDeploymentConsoleStore.ingest(config.company_id,operation,result);
  return result;
 }catch(error){
  const receipt={schema:'titan.workforce.gateway.receipt.v1',receipt_id:`local-failure-${request.request_id}`,request_id:request.request_id,company_id:request.company_id,source_surface:'titan_code',target_domain:'deployment_workforce',operation,status:'rejected',reason:String(error?.message||error).slice(0,1000),applied:false,grants_authority:false,trace_id:request.trace_id,correlation_id:request.correlation_id,causation_id:request.causation_id,deployment_mission_id:request.deployment_mission_id,client_workforce_handover_id:request.client_workforce_handover_id,recorded_at:new Date().toISOString()};
  await global.CodeeDeploymentConsoleStore.recordReceipt(config.company_id,receipt);throw error;
 }
}
async function refresh(options={}){
 const config=await getConfig();if(!config.endpoint||!config.company_id||!config.actor_id)return {...await selectedState(config),connected:false,reason:'gateway-configuration-required'};
 const errors=[];let gateway=null;
 try{gateway=await invoke(config,'deployment.gateway.status',{payload:{client:'titan-code',contract:'v1'}});}catch(error){errors.push({operation:'deployment.gateway.status',error:String(error?.message||error)});}
 try{await invoke(config,'deployment.mission.list',{payload:{limit:100}});}catch(error){errors.push({operation:'deployment.mission.list',error:String(error?.message||error)});}
 let current=await global.CodeeDeploymentConsoleStore.load(config.company_id);const missionId=String(options.deployment_mission_id||current.selected_mission_id||'').trim();
 if(missionId){if(current.selected_mission_id!==missionId)await global.CodeeDeploymentConsoleStore.setSelectedMission(config.company_id,missionId);for(const op of DETAIL_OPS){try{await invoke(config,op,{deployment_mission_id:missionId,payload:{deployment_mission_id:missionId}});}catch(error){errors.push({operation:op,error:String(error?.message||error)});}}}
 current=await global.CodeeDeploymentConsoleStore.load(config.company_id);return {config:global.CodeeTitanWorkforceGateway.publicConfig(config),state:current,summary:global.CodeeDeploymentConsoleStore.summary(current),connected:Boolean(gateway),errors};
}
async function getState(options={}){const config=await getConfig();if(options.refresh===true)return refresh(options);return {...await selectedState(config),connected:false,reason:config.endpoint?'not-probed':'gateway-configuration-required'};}
async function selectMission(mission_id){const config=await getConfig();if(!config.company_id)throw new Error('company_id-required');const state=await global.CodeeDeploymentConsoleStore.setSelectedMission(config.company_id,mission_id);return {config:global.CodeeTitanWorkforceGateway.publicConfig(config),state,summary:global.CodeeDeploymentConsoleStore.summary(state)};}
async function submit(input={}){const config=await getConfig();const operation=String(input.operation||'');const current=await global.CodeeDeploymentConsoleStore.load(config.company_id);const missionId=input.deployment_mission_id||current.selected_mission_id||null;const result=await invoke(config,operation,{deployment_mission_id:missionId,payload:input.payload||{},correlation_id:input.correlation_id||null,causation_id:input.causation_id||null});return {result,...await selectedState(config)};}
async function receipts(){const config=await getConfig();if(!config.company_id)return {config:global.CodeeTitanWorkforceGateway.publicConfig(config),receipts:[]};const state=await global.CodeeDeploymentConsoleStore.load(config.company_id);return {config:global.CodeeTitanWorkforceGateway.publicConfig(config),receipts:state.receipts||[]};}
function capabilityMap(){return {mission:['list','get','create','advance'],intake:['get'],discovery:['get','questions','participation'],team:['participation.get','participation.propose'],evidence:['list','request'],readiness:['get'],engineering:['get','propose'],installation:['get','propose'],commissioning:['get','propose'],handover:['get','prepare'],changeRequests:['list','accept'],receipts:['list']};}
global.CodeeDeploymentWorkforceConsole=Object.freeze({CONFIG_KEY,DETAIL_OPS,getConfig,updateConfig,getState,refresh,selectMission,submit,receipts,capabilityMap});
})(typeof globalThis!=='undefined'?globalThis:this);
