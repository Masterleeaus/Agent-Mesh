(function attachTitanZeroRouteConsumerIndex(global){
  'use strict';
  const MAX_ROUTE_NAMES=10000, MAX_REFERENCES_PER_FILE=5000, MAX_CONSUMERS=20000;
  function ignored(path){return global.CodeeTitanZeroSnapshotPolicy?.shouldIgnore?.(path)||false;}
  function analyze(files,routeReport){
    const consumers=[]; const byRoute=Object.create(null); let truncated=false;
    const allRouteNames=(routeReport?.routes||[]).map(r=>r?.name).filter(Boolean);
    if(allRouteNames.length>MAX_ROUTE_NAMES) truncated=true;
    const routeNames=new Set(allRouteNames.slice(0,MAX_ROUTE_NAMES));
    outer: for(const [path,raw] of Object.entries(files||{})){
      if(ignored(path) || !/\.blade\.php$|\.php$|\.(?:js|jsx|ts|tsx)$/i.test(path)) continue;
      const text=String(raw||''); const found=new Set();
      const add=name=>{if(found.size>=MAX_REFERENCES_PER_FILE){truncated=true;return false;}if(routeNames.has(name))found.add(name);return true;};
      const direct=/(?:route|to_route|redirect\(\)->route)\s*\(\s*['"]([^'"]+)['"]/g; let match;
      while((match=direct.exec(text))){if(!add(match[1]))break;}
      // Preserve the donor's broad "route name mentioned in a relevant source file" behavior
      // without scanning every known route against every file. Extract bounded string literals once
      // and intersect them with the known-route set instead.
      const literal=/['"]([^'"\r\n]{1,500})['"]/g; let literalCount=0;
      while((match=literal.exec(text))){
        if(++literalCount>MAX_REFERENCES_PER_FILE){truncated=true;break;}
        if(routeNames.has(match[1])&&!add(match[1]))break;
      }
      for(const name of found){
        if(consumers.length>=MAX_CONSUMERS){truncated=true;break outer;}
        const item={path,route:name,known:true,kind:/\.blade\.php$/i.test(path)?'blade':/\.(?:js|jsx|ts|tsx)$/i.test(path)?'javascript':/(?:^|\/)tests\//i.test(path)?'test':'php'};
        consumers.push(item); if(!byRoute[name]) byRoute[name]=[]; if(byRoute[name].length<1000)byRoute[name].push(item); else truncated=true;
      }
    }
    const unknown=consumers.filter(c=>!c.known);
    return {consumers,byRoute,unknownRouteReferences:unknown,knownRoutes:Array.from(routeNames).sort(),truncated};
  }
  global.CodeeTitanZeroRouteConsumerIndex=Object.freeze({analyze,MAX_ROUTE_NAMES,MAX_REFERENCES_PER_FILE,MAX_CONSUMERS});
})(typeof globalThis!=='undefined'?globalThis:this);
