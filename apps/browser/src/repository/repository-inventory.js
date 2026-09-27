(function attachRepositoryInventory(global){
'use strict';
function build(snapshot,options){const files=snapshot?.files||{};const rows=[];const byLanguage={};const byDomain={};let bytes=0;for(const [rawPath,content] of Object.entries(files)){const meta=global.CodeeRepositoryPolicy.classify(rawPath);if(!global.CodeeRepositoryPolicy.isInScope(rawPath,options))continue;const size=String(content??'').length;rows.push({...meta,bytes:size});bytes+=size;byLanguage[meta.language]=(byLanguage[meta.language]||0)+1;byDomain[meta.domain]=(byDomain[meta.domain]||0)+1;}
rows.sort((a,b)=>a.path.localeCompare(b.path));const frameworkSignals={laravel:!!files['artisan']||/laravel\/framework/i.test(String(files['composer.json']||'')),react:/"react"\s*:/i.test(String(files['package.json']||'')),livewire:/livewire\/livewire/i.test(String(files['composer.json']||'')),vite:/"vite"\s*:/i.test(String(files['package.json']||''))};return {files:rows.length,bytes,extensionFiles:rows.filter(x=>x.domain==='extension').length,byLanguage,byDomain,frameworkSignals,entries:rows};}
global.CodeeRepositoryInventory=Object.freeze({build});
})(typeof globalThis!=='undefined'?globalThis:this);
