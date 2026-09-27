(function attachRepositoryEvidenceContract(global){
'use strict';
const SCHEMA='titan-code-repository-evidence/v1';
const MAX_TEXT_CHARS=4000;
const MAX_ITEMS=500;
function fail(code,message,details){const e=new Error(message);e.code=code;if(details)e.details=details;return e;}
function clamp(n,min,max){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):min;}
function normalizePath(path){if(global.CodeeRepositoryPolicy?.normalize)return global.CodeeRepositoryPolicy.normalize(path);return String(path||'').replace(/\\/g,'/').replace(/^\.\//,'');}
function redact(text){const value=String(text??'');return global.CodeeRepositoryPolicy?.redactText?global.CodeeRepositoryPolicy.redactText(value):value;}
function stableHash(input){let h=2166136261;const s=String(input);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function evidenceId(parts){return `repo:${stableHash(parts.join('\u241f'))}`;}
function normalizeEvidence(input,options){
 if(!input||typeof input!=='object')throw fail('ERR_REPOSITORY_EVIDENCE_INVALID','Repository evidence must be an object');
 const sourceKind=String(input.source_kind||input.sourceKind||'repository').slice(0,64);
 const path=normalizePath(input.path||'');
 const line=input.line==null?null:clamp(input.line,1,100000000);
 const symbol=input.symbol==null?null:String(input.symbol).slice(0,256);
 const text=redact(input.text??input.content??'').slice(0,Math.min(Number(options?.maxTextChars)||MAX_TEXT_CHARS,MAX_TEXT_CHARS));
 if(!path&&!text&&!symbol)throw fail('ERR_REPOSITORY_EVIDENCE_EMPTY','Repository evidence requires path, symbol, or text');
 const deterministic= input.deterministic!==false;
 const confidence=deterministic?1:clamp(input.confidence,0,1);
 const id=String(input.evidence_id||input.evidenceId||evidenceId([sourceKind,path,line??'',symbol??'',text])).slice(0,256);
 return Object.freeze({schema:SCHEMA,evidence_id:id,source_kind:sourceKind,path,line,symbol,text,deterministic,confidence,advisory_only:true,authority:false,canonical:false,mutation_authorized:false,plan_advance:false});
}
function fromSearch(result,options){const list=[];for(const match of result?.matches||[]){if(list.length>=Math.min(Number(options?.limit)||MAX_ITEMS,MAX_ITEMS))break;list.push(normalizeEvidence({source_kind:'repository.search',path:match.path,line:match.line,text:match.text,deterministic:true},options));}return list;}
function fromSymbols(index,options){const list=[];for(const symbol of index?.symbols||[]){if(list.length>=Math.min(Number(options?.limit)||MAX_ITEMS,MAX_ITEMS))break;list.push(normalizeEvidence({source_kind:'repository.symbol',path:symbol.path,line:symbol.line,symbol:symbol.name,text:symbol.kind,deterministic:true},options));}return list;}
function fromDependencies(graph,options){const list=[];for(const edge of graph?.edges||[]){if(list.length>=Math.min(Number(options?.limit)||MAX_ITEMS,MAX_ITEMS))break;list.push(normalizeEvidence({source_kind:'repository.dependency',path:edge.from,symbol:edge.symbol,text:`${edge.type||'reference'} -> ${normalizePath(edge.to)}`,deterministic:true},options));}return list;}
function merge(sources,options){const cap=Math.min(Number(options?.limit)||MAX_ITEMS,MAX_ITEMS);const out=[];const seen=new Set();for(const source of sources||[]){for(const raw of source||[]){const item=raw?.schema===SCHEMA?raw:normalizeEvidence(raw,options);if(seen.has(item.evidence_id))continue;seen.add(item.evidence_id);out.push(item);if(out.length>=cap)return out;}}return out;}
function capability(){return Object.freeze({schema:SCHEMA,max_text_chars:MAX_TEXT_CHARS,max_items:MAX_ITEMS,sources:['repository.search','repository.symbol','repository.dependency'],advisory_only:true,authority:false,canonical:false,mutation_authorized:false,plan_advance:false});}
global.CodeeRepositoryEvidenceContract=Object.freeze({SCHEMA,MAX_TEXT_CHARS,MAX_ITEMS,normalizeEvidence,fromSearch,fromSymbols,fromDependencies,merge,capability,evidenceId});
})(typeof globalThis!=='undefined'?globalThis:this);
