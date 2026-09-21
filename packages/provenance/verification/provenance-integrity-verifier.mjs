import crypto from 'node:crypto';

const HEX64=/^[a-f0-9]{64}$/;
const sha256=(bytes)=>crypto.createHash('sha256').update(bytes).digest('hex');
const norm=(v)=>String(v||'').replace(/\\/g,'/').replace(/^\.\//,'');

export async function verifyProvenanceIntegrity({index,deletionLedger={deleted:[]},exists,readBytes,resolveExternal=null}={}){
  if(!index || !Array.isArray(index.references)) throw new Error('provenance index references required');
  if(typeof exists!=='function' || typeof readBytes!=='function') throw new Error('exists/readBytes adapters required');
  const deleted=new Set((deletionLedger.deleted||[]).map(norm));
  const blockers=[]; const verified=[];
  for(const ref of index.references){
    const original=norm(ref.original_path);
    const hash=String(ref.sha256||'').toLowerCase();
    const locator=String(ref.logical_locator||'');
    if(!original){ blockers.push({code:'MISSING_ORIGINAL_PATH'}); continue; }
    if(!HEX64.test(hash)){ blockers.push({code:'INVALID_SHA256',path:original}); continue; }
    if(locator!==`provenance://sha256/${hash}`){ blockers.push({code:'BROKEN_LOGICAL_LOCATOR',path:original}); continue; }
    if(await exists(original)){
      const actual=sha256(await readBytes(original));
      if(actual!==hash){ blockers.push({code:'STALE_OR_CORRUPT_ORIGINAL_HASH',path:original,expected:hash,actual}); continue; }
      verified.push({path:original,mode:'ORIGINAL_BYTES'}); continue;
    }
    if(!deleted.has(original)){
      blockers.push({code:'ACCIDENTAL_EVIDENCE_LOSS',path:original}); continue;
    }
    const canonical=norm(ref.canonical_equivalent_path);
    if(canonical){
      if(!(await exists(canonical))){ blockers.push({code:'MISSING_CANONICAL_EQUIVALENT',path:original,canonical}); continue; }
      const actual=sha256(await readBytes(canonical));
      const expectedCanonical=String(ref.canonical_equivalent_sha256||'').toLowerCase();
      if(actual!==hash || expectedCanonical!==hash){ blockers.push({code:'CANONICAL_EQUIVALENCE_HASH_MISMATCH',path:original,canonical}); continue; }
      verified.push({path:original,mode:'CANONICAL_EQUIVALENT',canonical}); continue;
    }
    if(!ref.external_storage_binding){ blockers.push({code:'MISSING_DURABLE_EXTERNAL_BINDING',path:original}); continue; }
    if(typeof resolveExternal!=='function'){ blockers.push({code:'EXTERNAL_RESOLUTION_UNAVAILABLE',path:original}); continue; }
    const bytes=await resolveExternal(ref);
    if(!bytes){ blockers.push({code:'BROKEN_EXTERNAL_REFERENCE',path:original}); continue; }
    const actual=sha256(bytes);
    if(actual!==hash){ blockers.push({code:'STALE_EXTERNAL_HASH',path:original,expected:hash,actual}); continue; }
    verified.push({path:original,mode:'EXTERNAL_BINDING'});
  }
  return {schema:'titan-zero-provenance-integrity-result/v1',ok:blockers.length===0,verified_count:verified.length,blocker_count:blockers.length,verified,blockers,grants_authority:false};
}
