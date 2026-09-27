const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');const ctx={console};ctx.globalThis=ctx;vm.createContext(ctx);
for(const f of ['src/repository/repository-policy.js','src/repository/repository-search.js','src/repository/symbol-index.js','src/repository/dependency-graph.js','src/intelligence/repository-evidence-contract.js','src/intelligence/repository-chunker.js','src/intelligence/repository-embeddings.js','src/intelligence/repository-evidence-ranker.js','src/intelligence/repository-hybrid-retriever.js']){if(fs.existsSync(path.join(root,f)))vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});}
if(!ctx.CodeeRepositorySearch){console.log('SKIP integration fixture missing legacy globals');process.exit(0);}
const snapshot={files:{'src/user.js':'class UserRepository { search(){ return true } }','src/service.js':'function searchUsers(){ return new UserRepository() }'}};
const ranker=new ctx.CodeeRepositoryEvidenceRanker.RepositoryEvidenceRanker({maxPerPath:2});
const retriever=new ctx.CodeeRepositoryHybridRetriever.HybridRepositoryRetriever({ranker});
(async()=>{const out=await retriever.retrieve(snapshot,'UserRepository search',{limit:5,vector:false});assert.equal(out.ranking,'evidence_ranker_v1');assert(out.results.length>0);for(const r of out.results){assert.equal(r.authority,false);assert(r.provenance_strength>=0&&r.provenance_strength<=1);}console.log('PASS repository hybrid ranking integration');})().catch(e=>{console.error(e);process.exit(1)});
