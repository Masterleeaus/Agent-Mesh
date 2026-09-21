const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/content-script.js','utf8');
const context={console:{log(){},warn(){},error(){}},document:{addEventListener(){},querySelectorAll(){return[]},querySelector(){return null},documentElement:{}},chrome:{runtime:{id:'x',onMessage:{addListener(){}},sendMessage:async()=>({ok:true})}},window:{location:{hostname:'chatgpt.com'}},MutationObserver:class{observe(){} disconnect(){}},setInterval(){return 1},clearInterval(){},setTimeout(){return 1},clearTimeout(){},Set,Map,Array,String,Number,RegExp};
vm.runInNewContext(source,context);
const base={planId:'p',runId:'r',stepId:'step-01',stepToken:'token-x',stepCompleted:1,stepTotal:3,status:'completed',nextAction:'advance',artifactId:'a',parentSha256:'N/A',verification:'PASS',sha256:'a'.repeat(64),zip:'a.zip'};
const key=context.getArtifactDetectionKey(base);
for(const [field,value] of [['planId','p2'],['stepTotal',4],['artifactId','a2'],['parentSha256','b'.repeat(64)],['verification','FAIL']]){
 const changed={...base,[field]:value};
 assert.notStrictEqual(context.getArtifactDetectionKey(changed),key,`detection key must include ${field} so corrected signatures can be retried`);
}
console.log('artifact detection key covers validated fields OK');
