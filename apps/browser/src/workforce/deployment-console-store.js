(function attachDeploymentConsoleStore(global){
'use strict';
const STORAGE_KEY='codeeDeploymentWorkforceConsoleV1';
const MAX_RECEIPTS=250,MAX_PROJECTIONS=120,MAX_MISSIONS=100;
const emptyCompany=company_id=>({company_id,selected_mission_id:null,missions:[],projections:{},receipts:[],pending_requests:[],updated_at:null});
function cleanId(v,max=160){return String(v||'').trim().slice(0,max);}
function clone(v){try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}}
async function readRoot(){if(!global.chrome?.storage?.local)return {version:1,companies:{}};const row=await global.chrome.storage.local.get([STORAGE_KEY]);const raw=row?.[STORAGE_KEY];return raw&&raw.version===1&&raw.companies&&typeof raw.companies==='object'?raw:{version:1,companies:{}};}
async function writeRoot(root){if(global.chrome?.storage?.local)await global.chrome.storage.local.set({[STORAGE_KEY]:root});return root;}
function normalizeCompany(value,company_id){const v=value&&typeof value==='object'?value:emptyCompany(company_id);return {company_id,selected_mission_id:v.selected_mission_id||null,missions:Array.isArray(v.missions)?v.missions.slice(0,MAX_MISSIONS):[],projections:v.projections&&typeof v.projections==='object'?v.projections:{},receipts:Array.isArray(v.receipts)?v.receipts.slice(-MAX_RECEIPTS):[],pending_requests:Array.isArray(v.pending_requests)?v.pending_requests.slice(-100):[],updated_at:v.updated_at||null};}
async function load(company_id){const id=cleanId(company_id,128);if(!id)throw new Error('company_id-required');const root=await readRoot();return clone(normalizeCompany(root.companies[id],id));}
async function update(company_id,fn){const id=cleanId(company_id,128);if(!id)throw new Error('company_id-required');const root=await readRoot();const current=normalizeCompany(root.companies[id],id);const next=normalizeCompany(fn(clone(current))||current,id);next.updated_at=new Date().toISOString();root.companies[id]=next;await writeRoot(root);return clone(next);}
async function setSelectedMission(company_id,mission_id){return update(company_id,s=>{s.selected_mission_id=cleanId(mission_id,160)||null;return s;});}
async function recordRequest(company_id,request){return update(company_id,s=>{s.pending_requests=[...s.pending_requests,{request_id:request.request_id,operation:request.operation,deployment_mission_id:request.deployment_mission_id||null,requested_at:request.requested_at}].slice(-100);return s;});}
async function recordReceipt(company_id,receipt){return update(company_id,s=>{s.receipts=[...s.receipts,receipt].slice(-MAX_RECEIPTS);s.pending_requests=s.pending_requests.filter(r=>r.request_id!==receipt.request_id);return s;});}
function projectionKey(operation){return String(operation||'').replace(/^deployment\./,'').replace(/\.get$|\.list$|\.status$/,'').replace(/\./g,'_')||'unknown';}
async function ingest(company_id,operation,result){return update(company_id,s=>{const data=result?.data??result?.projection?.data??result?.projection??null;if(data!=null)s.projections[projectionKey(operation)]={operation,data,received_at:new Date().toISOString()};if(operation==='deployment.mission.list'){
 const rows=Array.isArray(data)?data:Array.isArray(data?.missions)?data.missions:[];s.missions=rows.filter(x=>x&&x.company_id===company_id).slice(0,MAX_MISSIONS);if(!s.selected_mission_id&&s.missions[0])s.selected_mission_id=s.missions[0].deployment_mission_id||s.missions[0].id||null;
 }return s;});}
function summary(state){const s=state||{};const p=s.projections||{};const mission=(s.missions||[]).find(x=>(x.deployment_mission_id||x.id)===s.selected_mission_id)||p.mission?.data||null;return {company_id:s.company_id||'',selected_mission_id:s.selected_mission_id||null,mission,mission_count:(s.missions||[]).length,receipt_count:(s.receipts||[]).length,pending_count:(s.pending_requests||[]).length,projection_keys:Object.keys(p),updated_at:s.updated_at||null};}
global.CodeeDeploymentConsoleStore=Object.freeze({STORAGE_KEY,load,update,setSelectedMission,recordRequest,recordReceipt,ingest,summary,projectionKey});
})(typeof globalThis!=='undefined'?globalThis:this);
