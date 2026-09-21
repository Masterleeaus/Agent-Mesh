(function(g){'use strict';
function inspect(manager,capabilityState={}){if(!manager||typeof manager!=='object')return {id:null,status:'unavailable',missing:[],authority:{planAdvance:false}};const required=Array.isArray(manager.tools)?manager.tools:[];const missing=required.filter(t=>capabilityState?.[t]!==true);return {id:manager.id,status:missing.length?'degraded':'ready',missing,authority:{planAdvance:false}};}
g.CodeeManagerHealth=Object.freeze({inspect});})(globalThis);
