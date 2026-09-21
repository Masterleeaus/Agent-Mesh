(function attachDependencyGraph(global){
'use strict';
const MAX_EDGES=20000;
const MAX_TOKENS_PER_FILE=20000;
function addEdge(edges,edge){if(edges.length<MAX_EDGES)edges.push(edge);}
function build(snapshot,symbolIndex){
    const edges=[];const files=snapshot?.files||{};const names=symbolIndex?.byName||{};let truncated=false;
    for(const [rawPath,raw] of Object.entries(files)){
        if(!global.CodeeRepositoryPolicy.isInScope(rawPath))continue;
        const path=global.CodeeRepositoryPolicy.normalize(rawPath);const text=String(raw??'');
        const tokens=new Set();const tokenRe=/\b[A-Za-z_][A-Za-z0-9_]{2,}\b/g;let tokenMatch;let tokenCount=0;
        while((tokenMatch=tokenRe.exec(text))){
            tokenCount++;
            if(tokenCount>MAX_TOKENS_PER_FILE){truncated=true;break;}
            tokens.add(tokenMatch[0]);
        }
        for(const name of tokens){const targets=names[name];if(!Array.isArray(targets))continue;if(targets.some(s=>s.path===path))continue;for(const target of targets){addEdge(edges,{from:path,to:target.path,symbol:name,type:'reference'});if(edges.length>=MAX_EDGES){truncated=true;break;}}if(edges.length>=MAX_EDGES)break;}
        let m;const phpUse=/\buse\s+([A-Za-z_\\][A-Za-z0-9_\\]*)\s*;/g;while(edges.length<MAX_EDGES&&(m=phpUse.exec(text)))addEdge(edges,{from:path,to:m[1],symbol:m[1].split('\\').pop(),type:'import'});
        const jsImport=/\b(?:import[^'";]*from\s*|require\s*\()\s*['"]([^'"]+)['"]/g;while(edges.length<MAX_EDGES&&(m=jsImport.exec(text)))addEdge(edges,{from:path,to:m[1],symbol:m[1],type:'import'});
        if(edges.length>=MAX_EDGES){truncated=true;break;}
    }
    return {nodes:Object.keys(files).filter(p=>global.CodeeRepositoryPolicy.isInScope(p)).map(p=>global.CodeeRepositoryPolicy.normalize(p)),edges,truncated};
}
function dependents(graph,path){const target=global.CodeeRepositoryPolicy.normalize(path);return (graph?.edges||[]).filter(e=>e.to===target).map(e=>e.from);}
global.CodeeDependencyGraph=Object.freeze({build,dependents,MAX_EDGES,MAX_TOKENS_PER_FILE});
})(typeof globalThis!=='undefined'?globalThis:this);
