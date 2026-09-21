(function attachCodeeAIProviderRegistry(global){
'use strict';
const store=new Map();
function cloneFreeze(value,seen=new WeakMap()){if(!value||typeof value!=='object')return value;if(seen.has(value))return '[Circular]';const out=Array.isArray(value)?[]:{};seen.set(value,out);for(const [key,child] of Object.entries(value)){if(typeof child==='function'){out[key]=child;continue;}out[key]=cloneFreeze(child,seen);}return Object.freeze(out);}
function publicAdapter(adapter){const copy={};for(const [key,value] of Object.entries(adapter)){copy[key]=typeof value==='function'?value:cloneFreeze(value);}copy.id=String(adapter.id);copy.displayName=String(adapter.displayName||adapter.id).slice(0,160);copy.lifecycle=String(adapter.lifecycle||'ACTIVE').toUpperCase();copy.transport=String(adapter.transport||'unspecified').slice(0,80);return Object.freeze(copy);}
function register(adapter){if(!global.CodeeAIProviderContract) throw new Error('AI provider contract unavailable');global.CodeeAIProviderContract.assertAdapter(adapter);const stored=publicAdapter(adapter);store.set(stored.id,stored);return stored;}
function unregister(id){return store.delete(String(id||''));}
function get(id){return store.get(String(id||''))||null;}
function list(){return Array.from(store.values()).slice();}
function status(){const rows=list();return Object.freeze({providers:rows.length,active:rows.filter(x=>!['RETIRED','TEMPORARILY_UNAVAILABLE'].includes(x.lifecycle)).length,local:rows.filter(x=>x.lifecycle==='LOCAL').length,lifecycles:Object.freeze(rows.reduce((out,row)=>{out[row.lifecycle]=(out[row.lifecycle]||0)+1;return out;},Object.create(null)))});}
function clear(){store.clear();}
global.CodeeAIProviderRegistry=Object.freeze({register,unregister,get,list,status,clear});
})(typeof globalThis!=='undefined'?globalThis:this);
