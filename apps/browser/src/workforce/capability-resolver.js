(function(g){'use strict';
function resolve(manager,available=[]){
 if(!manager||typeof manager!=='object')return {ok:false,managerId:null,available:[],missing:[],ready:false,reason:'unknown-manager'};
 const set=new Set(Array.isArray(available)?available:[]);const required=Array.isArray(manager.tools)?manager.tools:[];const present=required.filter(x=>set.has(x));const missing=required.filter(x=>!set.has(x));
 return {ok:true,managerId:manager.id,available:present,missing,ready:missing.length===0};
}
g.CodeeCapabilityResolver=Object.freeze({resolve});})(globalThis);
