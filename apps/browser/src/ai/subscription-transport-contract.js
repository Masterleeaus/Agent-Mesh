(function attachCodeeSubscriptionTransportContract(global){
'use strict';
const REQUIRED=Object.freeze(['connect','disconnect','health','listModels','complete']);
function validate(transport){
 if(!transport||typeof transport!=='object')return {ok:false,reason:'transport-required'};
 for(const name of REQUIRED)if(typeof transport[name]!=='function')return {ok:false,reason:`missing-transport-operation:${name}`,operation:name};
 if(transport.supported!==true)return {ok:false,reason:'supported-transport-required'};
 return {ok:true,id:String(transport.id||'supported-subscription-transport')};
}
function assert(transport){const result=validate(transport);if(!result.ok)throw new Error(`Subscription transport rejected: ${result.reason}`);return result;}
global.CodeeSubscriptionTransportContract=Object.freeze({REQUIRED_OPERATIONS:REQUIRED,validate,assert});
})(typeof globalThis!=='undefined'?globalThis:this);
