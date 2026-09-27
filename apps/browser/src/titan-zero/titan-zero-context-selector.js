(function attachTitanZeroContextSelector(global){
  'use strict';
  const STOP=new Set(['the','a','an','and','or','to','of','for','in','on','with','change','fix','add','update','make','titan','zero']);
  function tokens(text){return Array.from(new Set(String(text||'').toLowerCase().split(/[^a-z0-9_]+/).filter(t=>t.length>2&&!STOP.has(t))));}
  function scoreNode(n,terms){const hay=`${n.id} ${n.type} ${n.label} ${n.path||''}`.toLowerCase();return terms.reduce((s,t)=>s+(hay.includes(t)?3:0),0)+(n.type==='table'?1:0);}
  function select(graph,query,options){
    const maxNodes=Math.max(1,Number(options?.maxNodes||24));const maxEdges=Math.max(1,Number(options?.maxEdges||50));const terms=tokens(query);
    const ranked=(graph?.nodes||[]).map(n=>({n,score:scoreNode(n,terms)})).sort((a,b)=>b.score-a.score||String(a.n.id).localeCompare(String(b.n.id)));
    const chosen=ranked.filter((x,i)=>x.score>0||i<Math.min(5,maxNodes)).slice(0,maxNodes).map(x=>x.n);const ids=new Set(chosen.map(n=>n.id));
    const firstEdges=(graph?.edges||[]).filter(e=>ids.has(e.from)||ids.has(e.to)).slice(0,maxEdges);for(const e of firstEdges){for(const id of [e.from,e.to]){if(!ids.has(id)&&chosen.length<maxNodes){const n=(graph.nodes||[]).find(x=>x.id===id);if(n){chosen.push(n);ids.add(id);}}}}
    return {query:String(query||''),terms,nodes:chosen,edges:(graph?.edges||[]).filter(e=>ids.has(e.from)&&ids.has(e.to)).slice(0,maxEdges),bounded:true};
  }
  global.CodeeTitanZeroContextSelector=Object.freeze({select,tokens});
})(typeof globalThis!=='undefined'?globalThis:this);
