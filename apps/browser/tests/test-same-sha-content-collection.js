const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/content-script.js','utf8');const pre=source.slice(0,source.indexOf('chrome.runtime.onMessage'));
const hash='a'.repeat(64);
function sig(step,token){return `CODEE_ARTIFACT\nPROTOCOL_VERSION: 2\nPLAN_ID: p\nRUN_ID: r\nSTEP_ID: step-0${step}\nSTEP_TOKEN: ${token}\nSTEP_COMPLETED: ${step}\nSTEP_TOTAL: 2\nSTATUS: completed\nARTIFACT_ID: a${step}\nZIP: same.zip\nTYPE: cumulative\nVERSION: 1\nPARENT_SHA256: ${step===1?'N/A':hash}\nSHA256: ${hash}\nZIP_SIZE: 1\nDELTA_SIZE: N/A\nFILES_CHANGED: 0\nTESTS: 1/1 PASS\nVERIFICATION: PASS\nCREATED_AT: 2026-08-15T19:00:00+10:00\nNEXT_ACTION: advance\nCODEE_ARTIFACT_READY`;}
const body=`${sig(1,'t1')}\n${sig(2,'t2')}`;
const context={console:{log(){},warn(){},error(){}},chrome:{runtime:{id:'x'}},document:{querySelectorAll(){return[];},body:{innerText:body},documentElement:{innerText:body}},Set,Map,Promise,Date,Math};vm.runInNewContext(pre,context);
const artifacts=context.collectCodeeArtifacts();
assert.strictEqual(artifacts.length,2,'content collection must preserve same-SHA artifacts from different signed steps');
console.log('content collector preserves same-SHA different-step artifacts OK');
