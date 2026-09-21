const fs=require('fs');const vm=require('vm');const assert=require('assert');
const contentSource=fs.readFileSync('src/content-script.js','utf8');
let stored={};const sessionStorage={getItem:k=>stored[k]??null,setItem:(k,v)=>{stored[k]=String(v)}};
const cctx={console:{log(){},warn(){},error(){}},sessionStorage,document:{addEventListener(){},querySelectorAll(){return[]},querySelector(){return null},documentElement:{}},chrome:{runtime:{id:'x',onMessage:{addListener(){}},sendMessage:async()=>({ok:true})}},window:{location:{hostname:'chatgpt.com'}},MutationObserver:class{observe(){} disconnect(){}},setInterval(){return 1},clearInterval(){},setTimeout(){return 1},clearTimeout(){},Set,Map,Array,String,Number,RegExp,JSON};
vm.runInNewContext(contentSource,cctx);
assert.strictEqual(typeof cctx.recordSubmittedStepToken,'function','content script must persist accepted step tokens');
cctx.recordSubmittedStepToken('token-abc');
assert.strictEqual(cctx.hasSubmittedStepToken('token-abc'),true,'accepted token must survive in session storage');

const workerSource=fs.readFileSync('src/lib/service-worker.js','utf8');
let sends=0;let codeeState={plan_7:{stateVersion:2,protocolMode:'signature_v2',planId:'p',runId:'r',plan:[{number:1,text:'one'}],stepIndex:0,dispatchStatus:'pending_send',currentStepId:'step-01',currentStepToken:'token-abc',knownVersions:[],knownArtifactHashes:[],consumedArtifactKeys:[],target:{url:'https://chatgpt.com/c/abc',conversationIdentity:'chatgpt:abc'}}};
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])},get:async()=>({id:7,url:'https://chatgpt.com/c/abc'}),async sendMessage(_id,msg){if(msg.action==='GET_PAGE_STATE')return{ok:true,versions:[],artifacts:[],hasSubmittedStepToken:true};if(msg.action==='SEND_PROMPT'){sends++;return{ok:true}}return{ok:true}}},storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async({codeeState:next})=>{codeeState=JSON.parse(JSON.stringify(next))}}}};
const wctx={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL,crypto:{randomUUID:()=> 'x'}};vm.runInNewContext(workerSource,wctx);
(async()=>{const result=await wctx.dispatchCurrentStep(7);assert.strictEqual(result.ok,true);assert.strictEqual(sends,0,'a step token already accepted by the page must not be submitted a second time after acknowledgement loss');assert.strictEqual(codeeState.plan_7.dispatchStatus,'awaiting_artifact');console.log('accepted step token prevents duplicate resend OK')})().catch(e=>{console.error(e);process.exit(1)});
