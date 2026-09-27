(function attachTitanZeroModelSchemaAnalyzer(global) {
    'use strict';
    const MAX_MODELS=5000, MAX_ARRAY_ITEMS=1000, MAX_CASTS=1000, MAX_FINDINGS=20000;
    function ignored(path) { return global.CodeeTitanZeroSnapshotPolicy?.shouldIgnore?.(path) || false; }
    function isModelPath(path) { return /^app\/Models\/.*\.php$/i.test(path) || /^app\/Extensions\/[^/]+\/(?:app\/)?Models\/.*\.php$/i.test(path); }
    function className(path, text) { return (String(text||'').match(/\bclass\s+([A-Za-z_][A-Za-z0-9_]*)/)||[])[1] || String(path).split('/').pop().replace(/\.php$/,''); }
    function explicitTable(text) { return (String(text||'').match(/protected\s+\$table\s*=\s*['"]([^'"]+)['"]/)||[])[1] || null; }
    function snakePlural(name) { const snake=String(name||'').replace(/([a-z0-9])([A-Z])/g,'$1_$2').toLowerCase();if(/y$/.test(snake)&&!/[aeiou]y$/.test(snake))return snake.slice(0,-1)+'ies';if(/(s|x|z|ch|sh)$/.test(snake))return snake+'es';return snake+'s'; }
    function parseArrayProperty(text, property, limit=MAX_ARRAY_ITEMS) {
        const re = new RegExp(`(?:protected|public)\\s+\\$${property}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*;`);
        const match = String(text||'').match(re); if(!match)return [];
        const out=[]; const itemRe=/['"]([^'"]+)['"]/g; let item; while(out.length<limit&&(item=itemRe.exec(match[1])))out.push(item[1]); return out;
    }
    function parseCasts(text, limit=MAX_CASTS) {
        const match=String(text||'').match(/protected\s+\$casts\s*=\s*\[([\s\S]*?)\]\s*;/); if(!match)return Object.create(null);
        const casts=Object.create(null);const itemRe=/['"]([^'"]+)['"]\s*=>\s*['"]([^'"]+)['"]/g;let item,count=0;while(count<limit&&(item=itemRe.exec(match[1]))){casts[item[1]]=item[2];count++;}return casts;
    }
    function analyze(files,schemaGraph){
        const models=[],findings=[];let truncated=false;
        const addFinding=f=>{if(findings.length<MAX_FINDINGS)findings.push(f);else truncated=true;};
        for(const [path,source] of Object.entries(files||{})){
            if(ignored(path)||!isModelPath(path))continue;if(models.length>=MAX_MODELS){truncated=true;break;}
            const text=String(source||''),name=className(path,text),table=explicitTable(text)||snakePlural(name);
            const fillable=parseArrayProperty(text,'fillable'),guarded=parseArrayProperty(text,'guarded'),casts=parseCasts(text);
            if(fillable.length>=MAX_ARRAY_ITEMS||guarded.length>=MAX_ARRAY_ITEMS||Object.keys(casts).length>=MAX_CASTS)truncated=true;
            const schemaTable=schemaGraph?.tableMap?.[table]||null;const model={path,className:name,table,fillable,guarded,casts,schemaFound:!!schemaTable};models.push(model);
            if(!schemaTable){addFinding({code:'MODEL_TABLE_MISSING',severity:'high',path,table,message:`Model ${name} maps to ${table}, absent from supplied core schema.`});continue;}
            const columns=new Set((schemaTable.columns||[]).map(c=>c.name));
            for(const column of fillable)if(!columns.has(column))addFinding({code:'FILLABLE_COLUMN_MISSING',severity:'medium',path,table,column,message:`Fillable column ${column} is absent from supplied schema.`});
            for(const column of Object.keys(casts))if(!columns.has(column))addFinding({code:'CAST_COLUMN_MISSING',severity:'medium',path,table,column,message:`Cast column ${column} is absent from supplied schema.`});
            for(const [column,cast] of Object.entries(casts)){const def=(schemaTable.columns||[]).find(c=>c.name===column);if(def&&['array','json','object','collection'].includes(String(cast).toLowerCase())&&!def.jsonLike)addFinding({code:'CAST_SCHEMA_TYPE_MISMATCH',severity:'low',path,table,column,message:`Model casts ${column} as ${cast}, but supplied schema type is ${def.type}.`});}
        }
        return {models,findings,missingTables:findings.filter(f=>f.code==='MODEL_TABLE_MISSING'),driftCount:findings.length,truncated};
    }
    global.CodeeTitanZeroModelSchemaAnalyzer=Object.freeze({analyze,explicitTable,parseArrayProperty,parseCasts,snakePlural,isModelPath,MAX_MODELS,MAX_ARRAY_ITEMS,MAX_CASTS,MAX_FINDINGS});
})(typeof globalThis!=='undefined'?globalThis:this);
