(function attachLogAnalyzer(global){
'use strict';
const LEVELS=['EMERGENCY','ALERT','CRITICAL','ERROR','WARNING','NOTICE','INFO','DEBUG'];
function analyze(text,options){const lines=String(text||'').split(/\r?\n/);const entries=[];let current=null;for(const raw of lines){const m=raw.match(/^\[([^\]]+)\]\s+([^.\s]+)\.([A-Z]+):\s*(.*)$/);if(m){if(current)entries.push(current);current={time:m[1],environment:m[2],level:m[3],message:global.CodeeRepositoryPolicy.redactText(m[4]),stack:[]};}else if(current&&raw.trim())current.stack.push(global.CodeeRepositoryPolicy.redactText(raw).slice(0,2000));}if(current)entries.push(current);const limit=Math.max(1,Math.min(Number(options?.limit)||100,500));const recent=entries.slice(-limit);const counts={};for(const e of recent)counts[e.level]=(counts[e.level]||0)+1;return {entries:recent,counts,highest:LEVELS.find(l=>counts[l])||null,totalParsed:entries.length};}
global.CodeeLogAnalyzer=Object.freeze({analyze});
})(typeof globalThis!=='undefined'?globalThis:this);
