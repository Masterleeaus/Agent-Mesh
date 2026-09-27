(function attachTitanZeroConfigAnalyzer(global){
  'use strict';
  const SENSITIVE=/(password|secret|token|api[_-]?key|private[_-]?key|credential|client[_-]?secret)/i;
  const MAX_FILES=5000,MAX_KEYS_PER_FILE=1000,MAX_GLOBAL_KEYS=10000;
  function analyze(files){
    const items=[];const envKeys=new Set();const sensitive=new Set();let truncated=false;
    for(const [path,raw] of Object.entries(files||{})){
      if(global.CodeeTitanZeroSnapshotPolicy?.shouldIgnore?.(path)||!/^config\/.*\.php$/i.test(path))continue;if(items.length>=MAX_FILES){truncated=true;break;}
      const text=String(raw||''),keys=[];const re=/env\(\s*['"]([^'"]+)['"]/g;let m;
      while((m=re.exec(text))){if(keys.length>=MAX_KEYS_PER_FILE){truncated=true;break;}const key=m[1].slice(0,240);keys.push(key);if(envKeys.size<MAX_GLOBAL_KEYS)envKeys.add(key);else truncated=true;if(SENSITIVE.test(key)&&sensitive.size<MAX_GLOBAL_KEYS)sensitive.add(key);}
      items.push({path,envKeys:keys,sensitiveEnvKeys:keys.filter(k=>SENSITIVE.test(k)),bytes:text.length});
    }
    return {files:items,envKeys:Array.from(envKeys).sort(),sensitiveEnvKeys:Array.from(sensitive).sort(),policy:'Environment variable names may be indexed; values must never be read or exported.',truncated};
  }
  global.CodeeTitanZeroConfigAnalyzer=Object.freeze({analyze,MAX_FILES,MAX_KEYS_PER_FILE,MAX_GLOBAL_KEYS});
})(typeof globalThis!=='undefined'?globalThis:this);
