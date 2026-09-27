(function(g){'use strict';
const SCHEMA='titan-zero.manager.git-baseline-state.v2';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function clean(v,max=256){return String(v||'').trim().slice(0,max);}
function isGitSha(v){return /^[a-f0-9]{40,64}$/i.test(clean(v,64));}
function isArtifactSha(v){return /^[a-f0-9]{64}$/i.test(clean(v,64));}
function create(input={}){const mainSha=clean(input.mainSha||input.gitMainSha,64).toLowerCase();if(!isGitSha(mainSha))throw new Error('valid git main SHA required');const artifactSha256=clean(input.artifactSha256||input.sha256,64).toLowerCase();if(artifactSha256&&!isArtifactSha(artifactSha256))throw new Error('invalid artifact sha256');return freeze({schema:SCHEMA,mainSha,artifactSha256:artifactSha256||null,artifact:clean(input.artifact,512),fileCount:Number.isInteger(input.fileCount)?input.fileCount:null,uncompressedBytes:Number.isFinite(input.uncompressedBytes)?Number(input.uncompressedBytes):null,status:clean(input.status||'GITHUB_MAIN_BASELINE',64),authority:{baseline:'git-main-sha',artifactHash:'verification-only'}});}
function descendsFrom(candidate,ancestorSha){if(!candidate||!isGitSha(ancestorSha))return false;const a=String(ancestorSha).toLowerCase();return candidate.mainSha===a||candidate.baseMainSha===a||candidate.mergeBaseSha===a;}
g.TitanZeroManagerBaselineState=freeze({SCHEMA,isGitSha,isArtifactSha,create,descendsFrom});
})(typeof globalThis!=='undefined'?globalThis:this);
