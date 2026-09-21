(function attachCodeeAIProviderContract(global){
'use strict';
const REQUIRED=Object.freeze(['connect','disconnect','health','listModels','getModel','getCapabilities','complete','stream','embed','countTokens','estimateCost','getQuota','getRateLimits','supportsTools','supportsStructuredOutput','supportsVision','supportsReasoning','supportsEmbeddings','supportsLongContext','supportsCaching','supportsBatch','supportsFiles']);
const LIFECYCLES=Object.freeze(['ACTIVE','DEGRADED','DEPRECATED','RETIRED','TEMPORARILY_UNAVAILABLE','CONFIGURATION_REQUIRED','PAID_ONLY','FREE_LIMITED','FREE','LOCAL','FREE_DEVELOPMENT','FREE_CREDIT_LIMITED','FREE_TRIAL','BYO_PAID_OR_PROMOTIONAL','PAID']);
function validateAdapter(adapter){
 if(!adapter||typeof adapter!=='object') return {ok:false,reason:'adapter-required'};
 if(!/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(String(adapter.id||''))) return {ok:false,reason:'invalid-provider-id'};
 for(const name of REQUIRED) if(typeof adapter[name]!=='function') return {ok:false,reason:`missing-provider-operation:${name}`,operation:name};
 if(!LIFECYCLES.includes(String(adapter.lifecycle||'ACTIVE').toUpperCase())) return {ok:false,reason:'invalid-provider-lifecycle'};
 return {ok:true,id:String(adapter.id),lifecycle:String(adapter.lifecycle||'ACTIVE').toUpperCase()};
}
function assertAdapter(adapter){const result=validateAdapter(adapter);if(!result.ok) throw new Error(result.operation?`Provider adapter requires ${result.operation}()`:`Invalid provider adapter: ${result.reason}`);return result;}
global.CodeeAIProviderContract=Object.freeze({REQUIRED_OPERATIONS:REQUIRED,LIFECYCLES,validateAdapter,assertAdapter});
})(typeof globalThis!=='undefined'?globalThis:this);
