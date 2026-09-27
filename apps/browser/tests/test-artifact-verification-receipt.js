const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('src/integration/artifact-verification-adapter.js','utf8');
const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(src,c);
(async()=>{
 const artifact={artifactId:'a1',zip:'build.zip',sha256:'a'.repeat(64),zipSize:'1234 bytes'};
 assert.strictEqual(c.CodeeArtifactVerificationAdapter.verifyReceipt(null,artifact).ok,false,'missing verifier must fail closed');
 assert.strictEqual(c.CodeeArtifactVerificationAdapter.verifyReceipt(null,artifact).reason,'artifact-verifier-unavailable');
 const bad={verified:true,receiptId:'r1',zip:'build.zip',path:'/downloads/build.zip',exists:true,downloadComplete:true,actualSha256:'b'.repeat(64),actualSize:1234,zipIntegrity:'PASS'};
 assert.strictEqual(c.CodeeArtifactVerificationAdapter.verifyReceipt(bad,artifact).reason,'artifact-sha256-mismatch');
 const ok={verified:true,receiptId:'r1',zip:'build.zip',path:'/downloads/build.zip',exists:true,downloadComplete:true,actualSha256:'a'.repeat(64),actualSize:1234,zipIntegrity:'PASS',verifiedAt:'2026-08-16T00:00:00Z'};
 const checked=c.CodeeArtifactVerificationAdapter.verifyReceipt(ok,artifact);
 assert.strictEqual(checked.ok,true);assert.strictEqual(checked.receipt.receiptId,'r1');
 console.log('artifact verification receipts fail closed and bind actual bytes');
})().catch(e=>{console.error(e);process.exit(1)});
