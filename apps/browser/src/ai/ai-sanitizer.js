(function attachCodeeAISanitizer(global){
'use strict';
const DEFAULTS=Object.freeze({maxDepth:8,maxNodes:5000,maxArray:200,maxKeys:200,maxString:20000});
const SECRET_PATTERNS=[
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+\/=:-]{6,}/gi,'$1 [REDACTED]'],
  [/\b(api[_-]?key|access[_-]?token|refresh[_-]?token|session[_-]?token|token|secret|password|passwd|client[_-]?secret|private[_-]?key|cookie)\b\s*[:=]\s*(["']?)[^\s,;"'}]+\2/gi,'$1=[REDACTED]'],
  [/\b(sk-[A-Za-z0-9_-]{12,}|AIza[0-9A-Za-z_-]{12,}|gh[pousr]_[A-Za-z0-9]{12,}|xox[baprs]-[A-Za-z0-9-]{12,})\b/g,'[REDACTED_SECRET]'],
  [/([a-z][a-z0-9+.-]*:\/\/)[^\s\/@:]+:[^\s\/@]+@/gi,'$1[REDACTED]@']
];
function redactString(value,maxString=DEFAULTS.maxString){
 let out=String(value??'').slice(0,Math.max(0,Number(maxString)||DEFAULTS.maxString));
 for(const [pattern,replacement] of SECRET_PATTERNS) out=out.replace(pattern,replacement);
 return out;
}
function sanitize(value,options={}){
 const limits={...DEFAULTS,...options}; let nodes=0;
 const walk=(item,depth)=>{
   nodes+=1; if(nodes>limits.maxNodes) return '[TRUNCATED_NODES]';
   if(depth>limits.maxDepth) return '[TRUNCATED_DEPTH]';
   if(item===null||item===undefined||typeof item==='boolean') return item??null;
   if(typeof item==='number') return Number.isFinite(item)?item:null;
   if(typeof item==='string') return redactString(item,limits.maxString);
   if(typeof item==='function'||typeof item==='symbol'||typeof item==='bigint') return undefined;
   if(Array.isArray(item)) return item.slice(0,limits.maxArray).map(child=>walk(child,depth+1)).filter(child=>child!==undefined);
   if(typeof item==='object'){
     const out=Object.create(null); let count=0;
     for(const [key,child] of Object.entries(item)){
       if(count++>=limits.maxKeys) break;
       const safeKey=redactString(key,240);
       if(/^(?:__proto__|prototype|constructor)$/i.test(safeKey)) continue;
       if(/(?:api[_-]?key|password|passwd|secret|access[_-]?token|refresh[_-]?token|session[_-]?token|token|private[_-]?key|credential|cookie)$/i.test(safeKey)){out[safeKey]='[REDACTED]';continue;}
       const safe=walk(child,depth+1); if(safe!==undefined) out[safeKey]=safe;
     }
     return out;
   }
   return redactString(item,limits.maxString);
 };
 return walk(value,0);
}
function deepFreeze(value,seen=new WeakSet()){
 if(!value||typeof value!=='object'||seen.has(value)) return value; seen.add(value);
 for(const child of Object.values(value)) deepFreeze(child,seen); return Object.freeze(value);
}
function immutable(value,options={}){return deepFreeze(sanitize(value,options));}
global.CodeeAISanitizer=Object.freeze({redactString,sanitize,deepFreeze,immutable,limits:DEFAULTS});
})(typeof globalThis!=='undefined'?globalThis:this);
