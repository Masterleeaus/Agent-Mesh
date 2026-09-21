(function attachCodeeAIModelRegistry(global){
'use strict';
const store=new Map();
function key(providerId,modelId){return `${String(providerId||'')}::${String(modelId||'')}`;}
function clone(value){return global.CodeeAISanitizer?global.CodeeAISanitizer.sanitize(value,{maxDepth:8,maxNodes:3000,maxArray:100,maxString:4000}):JSON.parse(JSON.stringify(value));}
function freeze(value,seen=new WeakSet()){if(!value||typeof value!=='object'||seen.has(value))return value;seen.add(value);for(const child of Object.values(value))freeze(child,seen);return Object.freeze(value);}
function upsert(input={}){const providerId=String(input.providerId||'').trim().slice(0,160),modelId=String(input.modelId||'').trim().slice(0,240);if(!providerId||!modelId)throw new Error('Model registry requires providerId and modelId');const row={providerId,modelId,displayName:String(input.displayName||modelId).slice(0,240),family:String(input.family||'').slice(0,160),lifecycle:String(input.lifecycle||'ACTIVE').toUpperCase().slice(0,80),freeStatus:String(input.freeStatus||'UNKNOWN').toUpperCase().slice(0,80),pricing:clone(input.pricing||{}),contextWindow:Math.max(0,Math.floor(Number(input.contextWindow)||0)),maxOutput:Math.max(0,Math.floor(Number(input.maxOutput)||0)),capabilities:clone(input.capabilities||{}),rateLimits:clone(input.rateLimits||{}),privacy:clone(input.privacy||{}),lastCapabilityProbe:Number(input.lastCapabilityProbe)||null,health:String(input.health||'UNKNOWN').toUpperCase().slice(0,80),reliabilityScore:Math.max(0,Math.min(1,Number(input.reliabilityScore)||0))};const stored=freeze(row);store.set(key(providerId,modelId),stored);return stored;}
function get(providerId,modelId){return store.get(key(providerId,modelId))||null;}
function list(filter={}){let rows=Array.from(store.values());if(filter.providerId)rows=rows.filter(x=>x.providerId===String(filter.providerId));if(filter.capability)rows=rows.filter(x=>Boolean(x.capabilities?.[filter.capability]));if(filter.freeOnly)rows=rows.filter(x=>['FREE','FREE_LIMITED','FREE_CREDIT_LIMITED','FREE_DEVELOPMENT','FREE_TRIAL','LOCAL'].includes(x.freeStatus));return rows.slice();}
function remove(providerId,modelId){return store.delete(key(providerId,modelId));}
function clear(){store.clear();}
function status(){const rows=list();return Object.freeze({models:rows.length,healthy:rows.filter(x=>x.health==='READY').length,local:rows.filter(x=>x.freeStatus==='LOCAL').length,free:rows.filter(x=>x.freeStatus.startsWith('FREE')).length});}
global.CodeeAIModelRegistry=Object.freeze({upsert,get,list,remove,clear,status});
})(typeof globalThis!=='undefined'?globalThis:this);
