const fs=require('fs'),vm=require('vm'),assert=require('assert');const source=fs.readFileSync('src/content-script.js','utf8');const pre=source.slice(0,source.indexOf('chrome.runtime.onMessage'));
const template=`CODEE_ARTIFACT\nPROTOCOL_VERSION: 2\nPLAN_ID: plan-real\nRUN_ID: run-real\nSTEP_ID: step-01\nSTEP_TOKEN: token-real\nSTEP_COMPLETED: 1\nSTEP_TOTAL: 5\nSTATUS: completed\nARTIFACT_ID: <unique artifact identifier>\nZIP: <exact final code ZIP filename>\nTYPE: <full_extension|cumulative|delta|patch|module|app|other>\nVERSION: <artifact version>\nPARENT_SHA256: N/A\nSHA256: <SHA-256 of the exact final ZIP>\nZIP_SIZE: <bytes>\nDELTA_SIZE: <bytes or N/A>\nFILES_CHANGED: <count>\nTESTS: <actual fresh test result or N/A>\nVERIFICATION: <PASS plus concise summary>\nCREATED_AT: <ISO-8601 timestamp with timezone>\nNEXT_ACTION: advance\nCODEE_ARTIFACT_READY`;
const c={console:{log(){},warn(){},error(){}},chrome:{runtime:{id:'x'}},document:{querySelectorAll(){return[{textContent:template}]},body:{textContent:template,innerText:template},documentElement:{textContent:template,innerText:template}},Set,Map,Promise,Date,Math};vm.runInNewContext(pre,c);
assert.strictEqual(c.parseCodeeArtifactBlocks(template).length,0,'Codee prompt footer templates must not parse as produced artifacts');
assert.strictEqual(c.collectCodeeArtifacts().length,0,'whole-page fallback must ignore Codee prompt footer templates');
console.log('CODEE completion templates are excluded from artifact detection');

const actual=template
  .replace('<unique artifact identifier>','artifact-real')
  .replace('<exact final code ZIP filename>','Build-v1.0.0.zip')
  .replace('<full_extension|cumulative|delta|patch|module|app|other>','cumulative')
  .replace('<artifact version>','1.0.0')
  .replace('<SHA-256 of the exact final ZIP>','a'.repeat(64))
  .replace('<bytes>','12345')
  .replace('<bytes or N/A>','N/A')
  .replace('<count>','3')
  .replace('<actual fresh test result or N/A>','10/10 PASS')
  .replace('<PASS plus concise summary>','PASS - verified')
  .replace('<ISO-8601 timestamp with timezone>','2026-08-16T04:30:00+10:00');
c.document.querySelectorAll=()=>[{textContent:template},{textContent:actual}];
c.document.body={textContent:`${template}
${actual}`,innerText:`${template}
${actual}`};
c.document.documentElement={textContent:`${template}
${actual}`,innerText:`${template}
${actual}`};
const mixed=c.collectCodeeArtifacts();
assert.strictEqual(mixed.length,1,'a real assistant artifact beside the prompt template must be detected exactly once');
assert.strictEqual(mixed[0].artifactId,'artifact-real');
console.log('real artifact wins over the matching prompt footer template');
