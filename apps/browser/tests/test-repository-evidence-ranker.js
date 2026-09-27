const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
const ctx={console};ctx.globalThis=ctx;vm.createContext(ctx);
for(const f of ['src/intelligence/repository-evidence-ranker.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const {RepositoryEvidenceRanker}=ctx.CodeeRepositoryEvidenceRanker;
const ranker=new RepositoryEvidenceRanker({maxPerPath:2,diversityPenalty:0.1});
const auth={advisory_only:true,authority:false,canonical:false,mutation_authorized:false,plan_advance:false};
const det={schema:'titan-code-repository-evidence/v1',evidence_id:'a',source_kind:'repository.search',path:'src/a.js',line:1,symbol:null,text:'alpha',deterministic:true,confidence:1,...auth};
const dup={...det,evidence_id:'b',source_kind:'repository.symbol'};
const model={...det,evidence_id:'c',path:'src/b.js',text:'beta',source_kind:'model.inference',deterministic:false,confidence:.95};
const other={...det,evidence_id:'d',path:'src/c.js',text:'gamma'};
const out=ranker.rank([
 {evidence:det,score:.8,score_components:{lexical:.8},reasons:['lexical']},
 {evidence:dup,score:.85,score_components:{symbol:1},reasons:['symbol_exact']},
 {evidence:model,score:.99,score_components:{vector:.99},reasons:['vector']},
 {evidence:other,score:.7,score_components:{lexical:.7},reasons:['lexical']}
],{limit:3,vectorStatus:'degraded'});
assert.equal(out.result_count,3);
assert.equal(out.results.filter(x=>x.evidence.path==='src/a.js').length,1,'cross-signal duplicate should merge');
const merged=out.results.find(x=>x.evidence.path==='src/a.js');
assert(merged.provenance.sources.includes('repository.search')&&merged.provenance.sources.includes('repository.symbol'));
assert.equal(merged.provenance_strength,1);
assert(out.results[0].evidence.path!=='src/b.js','model/degraded evidence should not outrank stronger deterministic evidence');
for(const row of out.results){assert.equal(row.authority,false);assert.equal(row.canonical,false);assert(row.diversity.factor>0&&row.diversity.factor<=1);}
console.log('PASS repository evidence ranker');
