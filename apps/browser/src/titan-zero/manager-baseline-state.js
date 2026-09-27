(function(g){'use strict';
const SCHEMA='titan-zero.manager.baseline-state.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function clean(v,max=256){return String(v||'').trim().slice(0,max);}
function isSha(v){return /^[a-f0-9]{64}$/i.test(clean(v,64));}
function create(input={}){const sha=clean(input.sha256,64).toLowerCase();if(!isSha(sha))throw new Error('valid baseline sha256 required');const parent=clean(input.parentSha256,64).toLowerCase();if(parent&&!isSha(parent))throw new Error('invalid parent sha256');return freeze({schema:SCHEMA,sha256:sha,parentSha256:parent||null,artifact:clean(input.artifact,512),lineageLabel:clean(input.lineageLabel,256),fileCount:Number.isInteger(input.fileCount)?input.fileCount:null,uncompressedBytes:Number.isFinite(input.uncompressedBytes)?Number(input.uncompressedBytes):null,status:clean(input.status||'FROZEN_DEVELOPMENT_BASE',64)});}
function descendsFrom(candidate,ancestorSha){if(!candidate||!isSha(ancestorSha))return false;const a=String(ancestorSha).toLowerCase();return candidate.sha256===a||candidate.parentSha256===a;}
g.TitanZeroManagerBaselineState=freeze({SCHEMA,isSha,create,descendsFrom});
})(typeof globalThis!=='undefined'?globalThis:this);
