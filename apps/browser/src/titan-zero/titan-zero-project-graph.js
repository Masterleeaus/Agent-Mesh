(function attachTitanZeroProjectGraph(global){
  'use strict';
  function node(id,type,label,path,meta){return {id,type,label,path:path||null,meta:meta||{}};}
  function edge(from,to,kind,meta){return {from,to,kind,meta:meta||{}};}
  function build(report,files){
    const nodes=[];const edges=[];const seen=new Set();
    const add=n=>{if(!seen.has(n.id)){seen.add(n.id);nodes.push(n);}};
    for(const t of report?.schemaGraph?.tables||[]) add(node(`table:${t.name}`,'table',t.name,null,{tenancy:t.tenancy,jsonColumns:t.jsonColumns}));
    for(const n of report?.architecture?.nodes||[]){if(global.CodeeTitanZeroSnapshotPolicy?.shouldIgnore?.(n.path))continue;add(node(`file:${n.path}`,n.kind,n.fqcn||n.className||n.path,n.path,{fqcn:n.fqcn}));}
    for(const r of report?.routes?.routes||[]){const id=`route:${r.name||r.path+':'+(r.uri||'')+':'+r.method}`;add(node(id,'route',r.name||`${r.method} ${r.uri}`,r.path,{method:r.method,uri:r.uri})); if(r.controller){const target=(report.architecture?.nodes||[]).find(n=>n.className===String(r.controller).split('\\').pop());if(target)edges.push(edge(id,`file:${target.path}`,'route_controller',{action:r.action}));}}
    for(const m of report?.modelSchema?.models||[]){const mid=`file:${m.path}`;const tid=`table:${m.table}`;if(seen.has(mid)&&seen.has(tid))edges.push(edge(mid,tid,'model_table',{}));}
    for(const b of report?.architecture?.containerBindings||[]){const provider=`file:${b.path}`;const concrete=(report.architecture?.nodes||[]).find(n=>n.fqcn&&String(n.fqcn).endsWith(String(b.concrete).replace(/^.*\\/,''))); if(concrete)edges.push(edge(provider,`file:${concrete.path}`,'container_binding',{abstract:b.abstract,method:b.method}));}
    for(const e of report?.architecture?.dependencyEdges||[]){const from=(report.architecture?.nodes||[]).find(n=>n.fqcn===e.from);const to=(report.architecture?.nodes||[]).find(n=>n.fqcn&&String(n.fqcn).endsWith(String(e.to).replace(/^.*\\/,'')));if(from&&to)edges.push(edge(`file:${from.path}`,`file:${to.path}`,'constructor_dependency',{}));}
    for(const [routeName,consumers] of Object.entries(report?.routeConsumers?.byRoute||{})){const rid=(report.routes?.routes||[]).find(r=>r.name===routeName);if(!rid)continue;const routeId=`route:${routeName}`;for(const c of consumers){if(global.CodeeTitanZeroSnapshotPolicy?.shouldIgnore?.(c.path))continue;const cid=`file:${c.path}`;if(!seen.has(cid))add(node(cid,c.kind,'consumer:'+c.path,c.path,{}));edges.push(edge(cid,routeId,'route_consumer',{}));}}
    for(const rel of report?.schemaGraph?.relations||[]){if(seen.has(`table:${rel.from}`)&&seen.has(`table:${rel.to}`))edges.push(edge(`table:${rel.from}`,`table:${rel.to}`,'foreign_key',{name:rel.name,via:rel.via}));}
    return {nodes,edges,stats:{nodes:nodes.length,edges:edges.length,types:Object.fromEntries(Array.from(new Set(nodes.map(n=>n.type))).map(type=>[type,nodes.filter(n=>n.type===type).length]))}};
  }
  global.CodeeTitanZeroProjectGraph=Object.freeze({build});
})(typeof globalThis!=='undefined'?globalThis:this);
