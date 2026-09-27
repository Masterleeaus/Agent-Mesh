(function attachArtifactVerificationAdapter(global){
'use strict';
const SHA256=/^[a-f0-9]{64}$/i;
function parseSize(value){const m=String(value??'').trim().match(/^(\d+)(?:\s*bytes?)?$/i);if(!m)return null;const n=Number(m[1]);return Number.isSafeInteger(n)&&n>=0?n:null;}
function receiptId(receipt){return String(receipt?.receiptId||receipt?.id||receipt?.verificationReceiptId||'').trim();}
function verifyReceipt(receipt,artifact,options){
 if(!receipt||typeof receipt!=='object')return {ok:false,reason:'artifact-verifier-unavailable'};
 if(receipt.verified!==true)return {ok:false,reason:'artifact-bytes-unverified'};
 const id=receiptId(receipt);if(!id)return {ok:false,reason:'artifact-receipt-id'};
 if(receipt.exists!==true)return {ok:false,reason:'artifact-not-found'};
 if(receipt.downloadComplete!==true)return {ok:false,reason:'artifact-download-incomplete'};
 const path=String(receipt.path||receipt.artifactPath||receipt.localPath||'').trim();if(!path)return {ok:false,reason:'artifact-path'};
 const expectedZip=String(artifact?.zip||'').trim();const actualZip=String(receipt.zip||receipt.filename||'').trim();
 if(!expectedZip||!actualZip||actualZip!==expectedZip)return {ok:false,reason:'artifact-zip-mismatch'};
 const expectedSha=String(artifact?.sha256||'').trim().toLowerCase();const actualSha=String(receipt.actualSha256||receipt.sha256||'').trim().toLowerCase();
 if(!SHA256.test(expectedSha)||!SHA256.test(actualSha))return {ok:false,reason:'artifact-sha256'};
 if(actualSha!==expectedSha)return {ok:false,reason:'artifact-sha256-mismatch'};
 const expectedSize=parseSize(artifact?.zipSize);const actualSize=parseSize(receipt.actualSize??receipt.size);
 if(actualSize===null)return {ok:false,reason:'artifact-size'};
 if(expectedSize!==null&&actualSize!==expectedSize)return {ok:false,reason:'artifact-size-mismatch'};
 if(String(receipt.zipIntegrity||receipt.integrity||'').trim().toUpperCase()!=='PASS')return {ok:false,reason:'artifact-zip-integrity'};
 const verifiedAt=String(receipt.verifiedAt||'').trim();
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(verifiedAt)||Number.isNaN(Date.parse(verifiedAt)))return {ok:false,reason:'artifact-verified-at'};
 const requireContentManifest=options?.requireContentManifest===true;
 const entryCount=Number(receipt.entryCount??receipt.entries);const manifestSha256=String(receipt.manifestSha256||'').trim().toLowerCase();
 if(requireContentManifest&&(receipt.contentManifestVerified!==true||!Number.isSafeInteger(entryCount)||entryCount<1||!SHA256.test(manifestSha256)))return {ok:false,reason:'artifact-content-manifest'};
 return {ok:true,receipt:{receiptId:id,zip:actualZip,path,actualSha256:actualSha,actualSize,zipIntegrity:'PASS',contentManifestVerified:receipt.contentManifestVerified===true,entryCount:Number.isSafeInteger(entryCount)&&entryCount>=0?entryCount:null,manifestSha256:SHA256.test(manifestSha256)?manifestSha256:'',verifiedAt}};
}
async function verifyWithHost(host,artifact,context){
 if(!host||typeof host.verifyArtifact!=='function')return {ok:false,reason:'artifact-verifier-unavailable'};
 let receipt;try{receipt=await host.verifyArtifact({artifact:{artifactId:String(artifact?.artifactId||''),zip:String(artifact?.zip||''),sha256:String(artifact?.sha256||''),zipSize:artifact?.zipSize??'',version:String(artifact?.version||'')},context:context&&typeof context==='object'?context:{}});}catch(error){return {ok:false,reason:'artifact-verifier-error',error:String(error?.message||error).slice(0,1000)};}
 return verifyReceipt(receipt,artifact,{requireContentManifest:context?.requireContentManifest===true});
}
global.CodeeArtifactVerificationAdapter=Object.freeze({parseSize,verifyReceipt,verifyWithHost});
})(typeof globalThis!=='undefined'?globalThis:this);
