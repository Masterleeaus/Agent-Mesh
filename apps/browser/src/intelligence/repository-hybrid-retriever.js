(function attachRepositoryHybridRetriever(global){
'use strict';
const SCHEMA='titan-code-repository-hybrid-retrieval/v1';
const MAX_CANDIDATES=256;
const MAX_RESULTS=100;
function fail(code,message){const e=new Error(message);e.code=code;return e;}
function clamp(n,min,max,fallback){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
function tokenize(text){return String(text||'').toLowerCase().match(/[a-z0-9_$.-]+/g)||[];}
function cosine(a,b){if(!Array.isArray(a)||!Array.isArray(b)||!a.length||!b.length)return 0;const n=Math.min(a.length,b.length);let dot=0,aa=0,bb=0;for(let i=0;i<n;i++){const x=Number(a[i]),y=Number(b[i]);if(!Number.isFinite(x)||!Number.isFinite(y))return 0;dot+=x*y;aa+=x*x;bb+=y*y;}return aa&&bb?dot/(Math.sqrt(aa)*Math.sqrt(bb)):0;}
function symbolMatches(index,query,limit){const terms=tokenize(query);if(!terms.length)return [];const out=[];for(const symbol of index?.symbols||[]){const name=String(symbol?.name||'').toLowerCase();if(!terms.some(t=>name.includes(t)))continue;out.push(symbol);if(out.length>=limit)break;}return out;}
function normalizeWeights(input){const src=input||{};const raw={lexical:clamp(src.lexical,0,10,0.45),symbol:clamp(src.symbol,0,10,0.2),dependency:clamp(src.dependency,0,10,0.1),vector:clamp(src.vector,0,10,0.25)};const total=raw.lexical+raw.symbol+raw.dependency+raw.vector||1;for(const k of Object.keys(raw))raw[k]/=total;return Object.freeze(raw);}
function authority(){return {advisory_only:true,authority:false,canonical:false,mutation_authorized:false,plan_advance:false};}
class HybridRepositoryRetriever{
 constructor(options){options=options||{};this.embeddings=options.embeddings||null;this.weights=normalizeWeights(options.weights);this.ranker=options.ranker||null;}
 capability(){return Object.freeze({schema:SCHEMA,max_candidates:MAX_CANDIDATES,max_results:MAX_RESULTS,sources:['repository.search','repository.symbol','repository.dependency','repository.chunk.vector'],weights:this.weights,vector_optional:true,...authority()});}
 async retrieve(snapshot,query,options){
  const q=String(query||'').trim().slice(0,2000);if(!q)throw fail('ERR_REPOSITORY_HYBRID_QUERY','Repository retrieval query is required');
  const limit=clamp(options?.limit,1,MAX_RESULTS,20);const candidateLimit=clamp(options?.candidateLimit,limit,MAX_CANDIDATES,Math.min(MAX_CANDIDATES,limit*8));const weights=normalizeWeights(options?.weights||this.weights);
  const qTerms=tokenize(q);
  const searchMatches=[];const searchSeen=new Set();let searchTruncated=false;
  const lexicalQueries=Array.from(new Set([q,...qTerms.filter(t=>t.length>=2)])).slice(0,12);
  for(const lexicalQuery of lexicalQueries){const partial=global.CodeeRepositorySearch.search(snapshot,lexicalQuery,{...(options?.searchOptions||{}),limit:candidateLimit});for(const match of partial?.matches||[]){const key=`${match.path}:${match.line}:${match.text}`;if(searchSeen.has(key))continue;searchSeen.add(key);searchMatches.push(match);if(searchMatches.length>=candidateLimit){searchTruncated=true;break;}}if(searchMatches.length>=candidateLimit)break;if(partial?.truncated)searchTruncated=true;}
  const search={query:q,matches:searchMatches,truncated:searchTruncated};
  const symbolIndex=options?.symbolIndex||global.CodeeSymbolIndex.build(snapshot);
  const symbols=symbolMatches(symbolIndex,q,candidateLimit);
  const graph=options?.dependencyGraph||global.CodeeDependencyGraph.build(snapshot,symbolIndex);
  const lexicalEvidence=global.CodeeRepositoryEvidenceContract.fromSearch(search,{limit:candidateLimit});
  const symbolEvidence=global.CodeeRepositoryEvidenceContract.fromSymbols({symbols},{limit:candidateLimit});
  const candidates=new Map();
  function ensure(ev){let row=candidates.get(ev.evidence_id);if(!row){row={evidence:ev,lexical:0,symbol:0,dependency:0,vector:0,reasons:[]};candidates.set(ev.evidence_id,row);}return row;}
  for(const ev of lexicalEvidence){const row=ensure(ev);const text=`${ev.path} ${ev.symbol||''} ${ev.text}`.toLowerCase();const hits=qTerms.reduce((n,t)=>n+(text.includes(t)?1:0),0);row.lexical=Math.min(1,0.55+(hits/Math.max(1,qTerms.length))*0.45);row.reasons.push('lexical');}
  for(const ev of symbolEvidence){const row=ensure(ev);const name=String(ev.symbol||'').toLowerCase();const exact=qTerms.some(t=>name===t);row.symbol=exact?1:0.8;row.reasons.push(exact?'symbol_exact':'symbol_partial');}
  const pathScores=new Map();for(const row of candidates.values()){const p=row.evidence.path;if(p)pathScores.set(p,Math.max(pathScores.get(p)||0,row.lexical,row.symbol));}
  for(const edge of graph?.edges||[]){const from=String(edge.from||''),to=String(edge.to||'');const base=Math.max(pathScores.get(from)||0,pathScores.get(to)||0);if(!base)continue;for(const row of candidates.values()){if(row.evidence.path===from||row.evidence.path===to){row.dependency=Math.max(row.dependency,Math.min(1,base*0.75));if(!row.reasons.includes('dependency'))row.reasons.push('dependency');}}
  }
  let vectorStatus='not_requested';
  if(this.embeddings&&options?.vector!==false){
   try{
    const chunks=global.CodeeRepositoryChunker.chunkSnapshot(snapshot,{maxChars:options?.chunkChars,maxChunks:candidateLimit});
    if(chunks.length){
     const [queryEmbedding]=await this.embeddings.embed([{id:'query',text:q}],{localOnly:options?.localOnly===true,signal:options?.signal,allowDeterministicFallback:options?.allowDeterministicFallback});
     const chunkEmbeddings=await this.embeddings.embed(chunks.map(c=>({id:c.chunk_id,text:c.text})),{localOnly:options?.localOnly===true,signal:options?.signal,allowDeterministicFallback:options?.allowDeterministicFallback});
     const vectorById=new Map(chunkEmbeddings.map(v=>[v.id,v]));
     for(const chunk of chunks){const embedded=vectorById.get(chunk.chunk_id);if(!embedded)continue;const score=Math.max(0,cosine(queryEmbedding.vector,embedded.vector));if(score<=0)continue;const ev=global.CodeeRepositoryEvidenceContract.normalizeEvidence({source_kind:'repository.chunk.vector',path:chunk.path,line:chunk.start_line,text:chunk.text,deterministic:embedded.deterministic===true,confidence:embedded.deterministic===true?1:score});const row=ensure(ev);row.vector=Math.max(row.vector,score);row.reasons.push('vector');}
     vectorStatus=queryEmbedding.degraded?'degraded':'available';
    }else vectorStatus='no_chunks';
   }catch(error){if(options?.signal?.aborted)throw error;vectorStatus=`unavailable:${String(error?.code||'ERR_VECTOR')}`;if(options?.requireVector)throw error;}
  }
  const preliminary=Array.from(candidates.values()).map(row=>{const score=row.lexical*weights.lexical+row.symbol*weights.symbol+row.dependency*weights.dependency+row.vector*weights.vector;return Object.freeze({evidence:row.evidence,score:Number(score.toFixed(6)),score_components:Object.freeze({lexical:row.lexical,symbol:row.symbol,dependency:row.dependency,vector:row.vector}),reasons:Object.freeze(Array.from(new Set(row.reasons))),...authority()});});
  const ranked=this.ranker?this.ranker.rank(preliminary,{limit,vectorStatus}).results:preliminary.sort((a,b)=>b.score-a.score||a.evidence.path.localeCompare(b.evidence.path)||Number(a.evidence.line||0)-Number(b.evidence.line||0)||a.evidence.evidence_id.localeCompare(b.evidence.evidence_id)).slice(0,limit);
  return Object.freeze({schema:SCHEMA,query:q,weights,vector_status:vectorStatus,result_count:ranked.length,results:Object.freeze(ranked),ranking:this.ranker?'evidence_ranker_v1':'base',...authority()});
 }
}
global.CodeeRepositoryHybridRetriever=Object.freeze({SCHEMA,MAX_CANDIDATES,MAX_RESULTS,HybridRepositoryRetriever,cosine,normalizeWeights});
})(typeof globalThis!=='undefined'?globalThis:this);
