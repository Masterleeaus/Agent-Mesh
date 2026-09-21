const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/content-script.js','utf8');
const sig=`CODEE_ARTIFACT\nPROTOCOL_VERSION: 2\nPLAN_ID: p\nRUN_ID: r\nSTEP_ID: step-01\nSTEP_TOKEN: t\nSTEP_COMPLETED: 1\nSTEP_TOTAL: 1\nSTATUS: completed\nARTIFACT_ID: a\nZIP: Build-v1.0.0.zip\nTYPE: cumulative\nVERSION: 1.0.0\nPARENT_SHA256: N/A\nSHA256: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\nZIP_SIZE: 1\nDELTA_SIZE: N/A\nFILES_CHANGED: 1\nTESTS: 1/1 PASS\nVERIFICATION: PASS\nCREATED_AT: 2026-08-15T21:00:00+10:00\nNEXT_ACTION: advance\nCODEE_ARTIFACT_READY`;
let artifactAttempts=0;
const chrome={runtime:{id:'x',onMessage:{addListener(){}},async sendMessage(message){ if(message.action==='ARTIFACT_DETECTED'){artifactAttempts++; return undefined;} return {ok:false};}}};
const context={chrome,console:{log(){},warn(){},error(){}},document:{querySelectorAll(){return[]},querySelector(){return null},body:{textContent:sig},documentElement:{textContent:sig}},window:{location:{hostname:'chatgpt.com'}},Event:function(){},KeyboardEvent:function(){},setInterval(){return 1},clearInterval(){},setTimeout(){return 1},clearTimeout(){},MutationObserver:undefined,Set,Map,Promise,Date,Math,sessionStorage:{getItem(){return null},setItem(){}}};
vm.runInNewContext(source,context);
(async()=>{
 await context.checkForZIP();
 await context.checkForZIP();
 assert.strictEqual(artifactAttempts,2,'undefined/no worker response must not mark an artifact as acknowledged');
 console.log('runtime no-response remains retryable OK');
})().catch(e=>{console.error(e);process.exit(1)});
