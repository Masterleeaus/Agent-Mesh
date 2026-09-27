(function attachCodeeAIProviderRegistry(global){
'use strict';
const store=new Map();
function cloneFreeze(value,seen=new WeakMap()){if(!value||typeof value!=='object')return value;if(seen.has(value))return '[Circular]';const out=Array.isArray(value)?[]:{};seen.set(value,out);for(const [key,child] of Object.entries(value)){if(typeof child==='function'){out[key]=child;continue;}out[key]=cloneFreeze(child,seen);}return Object.freeze(out);}
function publicAdapter(adapter){const copy={};for(const [key,value] of Object.entries(adapter)){copy[key]=typeof value==='function'?value:cloneFreeze(value);}copy.id=String(adapter.id);copy.displayName=String(adapter.displayName||adapter.id).slice(0,160);copy.lifecycle=String(adapter.lifecycle||'ACTIVE').toUpperCase();copy.transport=String(adapter.transport||'unspecified').slice(0,80);copy.locality=String(adapter.locality||'remote').trim().toLowerCase();if(!['device','local-network','remote'].includes(copy.locality))throw new Error('Invalid provider locality');copy.company_id=adapter.company_id==null?null:String(adapter.company_id);copy.activation_confers_authority=false;copy.authority_neutral=true;copy.execution_authority=false;return Object.freeze(copy);}
function register(adapter){if(adapter&&('tenant_id' in adapter||'tenant_company_id' in adapter))throw new Error('Legacy tenant authority is not accepted; use company_id');if(adapter?.company_id!=null){adapter={...adapter,company_id:String(adapter.company_id).trim()};if(!adapter.company_id)throw new Error('company_id required');}if(!global.CodeeAIProviderContract) throw new Error('AI provider contract unavailable');global.CodeeAIProviderContract.assertAdapter(adapter);const stored=publicAdapter(adapter);store.set(stored.id,stored);return stored;}
function unregister(id){return store.delete(String(id||''));}
function get(id){return store.get(String(id||''))||null;}
function list({company_id=null,locality=null}={}){
 const cid=company_id==null?null:String(company_id).trim();
 if(company_id!=null&&!cid)throw new Error('company_id required');
 const loc=locality==null?null:String(locality).trim().toLowerCase();
 if(loc&&!['device','local-network','remote'].includes(loc))throw new Error('Invalid provider locality');
 return Array.from(store.values()).filter(row=>(cid==null||row.company_id==null||row.company_id===cid)&&(loc==null||row.locality===loc));
}
function status(filters={}){const rows=list(filters);return Object.freeze({providers:rows.length,active:rows.filter(x=>!['RETIRED','TEMPORARILY_UNAVAILABLE'].includes(x.lifecycle)).length,local:rows.filter(x=>['device','local-network'].includes(x.locality)).length,remote:rows.filter(x=>x.locality==='remote').length,lifecycles:Object.freeze(rows.reduce((out,row)=>{out[row.lifecycle]=(out[row.lifecycle]||0)+1;return out;},Object.create(null)))});}
function clear(){store.clear();}
global.CodeeAIProviderRegistry=Object.freeze({register,unregister,get,list,status,clear});
})(typeof globalThis!=='undefined'?globalThis:this);
