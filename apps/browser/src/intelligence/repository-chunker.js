(function attachRepositoryChunker(global){
'use strict';
const SCHEMA='titan-code-repository-chunk/v1';
const DEFAULT_MAX_CHARS=1800;
const DEFAULT_OVERLAP_LINES=3;
const DEFAULT_MAX_CHUNKS=1000;
const MAX_CHARS_LIMIT=8000;
const MAX_OVERLAP_LINES=50;
function fail(code,message,details){const e=new Error(message);e.code=code;if(details)e.details=details;return e;}
function clamp(n,min,max,fallback){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
function normalizePath(path){if(global.CodeeRepositoryPolicy?.normalize)return global.CodeeRepositoryPolicy.normalize(path);return String(path||'').replace(/\\/g,'/').replace(/^\.\//,'');}
function redact(text){const value=String(text??'');return global.CodeeRepositoryPolicy?.redactText?global.CodeeRepositoryPolicy.redactText(value):value;}
function stableHash(input){let h=2166136261;const s=String(input);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function chunkId(path,startLine,endLine,text){return `chunk:${stableHash([path,startLine,endLine,text].join('\u241f'))}`;}
function makeChunk(path,lines,startIndex,endIndex,meta){
 const startLine=startIndex+1,endLine=endIndex+1;
 const text=redact(lines.slice(startIndex,endIndex+1).join('\n'));
 return Object.freeze({
  schema:SCHEMA,
  chunk_id:chunkId(path,startLine,endLine,text),
  path,
  start_line:startLine,
  end_line:endLine,
  text,
  chars:text.length,
  line_count:endLine-startLine+1,
  language:meta?.language||null,
  domain:meta?.domain||null,
  deterministic:true,
  confidence:1,
  advisory_only:true,
  authority:false,
  canonical:false,
  mutation_authorized:false,
  plan_advance:false
 });
}
function chunkFile(rawPath,rawContent,options){
 const path=normalizePath(rawPath);
 if(!path)throw fail('ERR_REPOSITORY_CHUNK_PATH','Repository chunk requires a path');
 if(global.CodeeRepositoryPolicy?.isInScope&&!global.CodeeRepositoryPolicy.isInScope(path,options))return [];
 const maxChars=clamp(options?.maxChars,128,MAX_CHARS_LIMIT,DEFAULT_MAX_CHARS);
 const overlapLines=clamp(options?.overlapLines,0,MAX_OVERLAP_LINES,DEFAULT_OVERLAP_LINES);
 const maxChunks=clamp(options?.maxChunks,1,DEFAULT_MAX_CHUNKS,DEFAULT_MAX_CHUNKS);
 const content=String(rawContent??'');
 if(!content)return [];
 const lines=content.split(/\r?\n/);
 const meta=global.CodeeRepositoryPolicy?.classify?global.CodeeRepositoryPolicy.classify(path):null;
 const out=[];
 let start=0;
 while(start<lines.length&&out.length<maxChunks){
  let end=start;
  let chars=0;
  while(end<lines.length){
   const candidate=redact(lines[end]);
   const next=chars+(end>start?1:0)+candidate.length;
   if(end>start&&next>maxChars)break;
   chars=next;
   end++;
   if(chars>=maxChars)break;
  }
  if(end<=start)end=start+1;
  const inclusiveEnd=end-1;
  out.push(makeChunk(path,lines,start,inclusiveEnd,meta));
  if(end>=lines.length)break;
  const consumed=end-start;
  const overlap=Math.min(overlapLines,Math.max(0,consumed-1));
  start=end-overlap;
 }
 return out;
}
function chunkSnapshot(snapshot,options){
 const out=[];
 const maxChunks=clamp(options?.maxChunks,1,DEFAULT_MAX_CHUNKS,DEFAULT_MAX_CHUNKS);
 const files=Object.entries(snapshot?.files||{}).sort(([a],[b])=>normalizePath(a).localeCompare(normalizePath(b)));
 for(const [path,content] of files){
  if(out.length>=maxChunks)break;
  const remaining=maxChunks-out.length;
  out.push(...chunkFile(path,content,{...options,maxChunks:remaining}));
 }
 return out;
}
function toEvidence(chunks,options){
 const contract=global.CodeeRepositoryEvidenceContract;
 if(!contract?.normalizeEvidence)throw fail('ERR_REPOSITORY_CHUNK_EVIDENCE_CONTRACT','Repository evidence contract is required');
 const limit=clamp(options?.limit,1,DEFAULT_MAX_CHUNKS,DEFAULT_MAX_CHUNKS);
 return (chunks||[]).slice(0,limit).map(chunk=>contract.normalizeEvidence({
  evidence_id:`evidence:${chunk.chunk_id}`,
  source_kind:'repository.chunk',
  path:chunk.path,
  line:chunk.start_line,
  text:chunk.text,
  deterministic:true
 },options));
}
function capability(){return Object.freeze({schema:SCHEMA,default_max_chars:DEFAULT_MAX_CHARS,max_chars_limit:MAX_CHARS_LIMIT,default_overlap_lines:DEFAULT_OVERLAP_LINES,max_overlap_lines:MAX_OVERLAP_LINES,default_max_chunks:DEFAULT_MAX_CHUNKS,advisory_only:true,authority:false,canonical:false,mutation_authorized:false,plan_advance:false});}
global.CodeeRepositoryChunker=Object.freeze({SCHEMA,DEFAULT_MAX_CHARS,DEFAULT_OVERLAP_LINES,DEFAULT_MAX_CHUNKS,MAX_CHARS_LIMIT,MAX_OVERLAP_LINES,chunkFile,chunkSnapshot,toEvidence,capability,chunkId});
})(typeof globalThis!=='undefined'?globalThis:this);
