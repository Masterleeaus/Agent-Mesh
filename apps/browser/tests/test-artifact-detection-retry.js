const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('src/content-script.js','utf8');
const signature=`CODEE_ARTIFACT\nPROTOCOL_VERSION: 2\nPLAN_ID: plan-r\nRUN_ID: run-r\nSTEP_ID: step-01\nSTEP_TOKEN: token-r\nSTEP_COMPLETED: 1\nSTEP_TOTAL: 2\nSTATUS: completed\nARTIFACT_ID: artifact-r\nZIP: Build-v1.0.0.zip\nTYPE: cumulative\nVERSION: 1.0.0\nPARENT_SHA256: N/A\nSHA256: cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc\nZIP_SIZE: 100\nDELTA_SIZE: N/A\nFILES_CHANGED: 1\nTESTS: 1/1 PASS\nVERIFICATION: PASS\nCREATED_AT: 2026-08-15T19:00:00+10:00\nNEXT_ACTION: advance\nCODEE_ARTIFACT_READY`;
let pageText='';
let artifactAttempts=0;
const chrome={runtime:{id:'test',onMessage:{addListener(){}},async sendMessage(message){
  if(message.action==='ARTIFACT_DETECTED') { artifactAttempts++; return artifactAttempts===1 ? {ok:false,error:'transient worker failure'} : {ok:true,advanced:true}; }
  return {ok:true};
}}};
const context={chrome,console:{log(){},warn(){},error(){}},document:{querySelectorAll(){return[];},querySelector(){return null;},body:{get innerText(){return pageText;}},documentElement:{get innerText(){return pageText;}}},window:{location:{hostname:'chatgpt.com'}},Event:function(){},KeyboardEvent:function(){},setInterval(){return 1;},clearInterval(){},setTimeout(fn){fn();return 1;},clearTimeout(){},Set,Map,Promise,Date,Math};
vm.runInNewContext(source,context);
(async()=>{
  pageText=signature;
  context.checkForZIP();
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(artifactAttempts,1,'first detection must reach worker');
  context.checkForZIP();
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(artifactAttempts,2,'failed worker acknowledgement must leave signature retryable');
  context.checkForZIP();
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(artifactAttempts,2,'successful worker acknowledgement must deduplicate later scans');
  console.log('artifact detection acknowledgement retry OK');
})().catch(error=>{console.error(error);process.exit(1);});
