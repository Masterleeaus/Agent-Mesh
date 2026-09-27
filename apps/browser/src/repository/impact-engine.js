(function attachImpactEngine(global){
'use strict';
const MAX_CHANGED_FILES=500;
const MAX_IMPACTED_FILES=2000;
const MAX_IMPACT_WORK_UNITS=64*1024*1024;
function stem(path){return global.CodeeRepositoryPolicy.normalize(path).split('/').pop().replace(/\.[^.]+$/,'');}
function escapeRx(value){return String(value||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function analyze(snapshot,changedFiles){
 const files=snapshot?.files||{};
 const changed=[...new Set((changedFiles||[]).filter(path=>global.CodeeRepositoryPolicy.isInScope(path)).map(global.CodeeRepositoryPolicy.normalize))].slice(0,MAX_CHANGED_FILES);
 const targets=changed.map(target=>{const name=stem(target);return {target,name,rx:name?new RegExp(`\\b${escapeRx(name)}\\b`):null,rel:target.replace(/^app\//,'').replace(/\.php$/,'').replaceAll('/','\\'),route:target.includes('/routes/')||target.startsWith('routes/'),model:target.includes('/Models/')}});
 const impacted=[];let workUnits=0;let truncatedWork=false;
 for(const [path,raw] of Object.entries(files)){
  const n=global.CodeeRepositoryPolicy.normalize(path);
  if(changed.includes(n)||!global.CodeeRepositoryPolicy.isInScope(n))continue;
  const text=String(raw??'');
  const projected=Math.max(1,targets.length)*text.length;
  if(workUnits+projected>MAX_IMPACT_WORK_UNITS){truncatedWork=true;break;}
  workUnits+=projected;
  let score=0;const reasons=[];
  for(const t of targets){
   if(t.rx&&t.rx.test(text)){score+=5;reasons.push(`references ${t.name}`);}
   if(t.rel&&text.includes(t.rel)){score+=4;reasons.push(`imports ${t.rel}`);}
   if(t.route&&/Controller|route\(/.test(text)){score+=1;reasons.push('route consumer');}
   if(t.model&&/(Controller|Service|Repository|Job|Policy)/.test(n)){score+=2;reasons.push('model consumer');}
  }
  if(score>0){impacted.push({path:n,score,reasons:[...new Set(reasons)]});if(impacted.length>=MAX_IMPACTED_FILES)break;}
 }
 impacted.sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path));
 const risk=changed.some(p=>/database\/migrations|config\/|(?:^|\/)routes\//.test(p))?'high':impacted.some(x=>x.score>=7)?'medium':'low';
 return {changed,impacted,risk,totalImpacted:impacted.length,truncatedChanged:(changedFiles||[]).length>MAX_CHANGED_FILES,truncatedImpacted:impacted.length>=MAX_IMPACTED_FILES,truncatedWork,workUnits};
}
global.CodeeImpactEngine=Object.freeze({analyze,MAX_CHANGED_FILES,MAX_IMPACTED_FILES,MAX_IMPACT_WORK_UNITS});
})(typeof globalThis!=='undefined'?globalThis:this);
