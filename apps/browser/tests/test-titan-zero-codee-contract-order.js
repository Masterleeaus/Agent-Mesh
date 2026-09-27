const fs=require('fs'); const vm=require('vm'); const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{create:async()=>{},get:async()=>({name:'ZIP_POLL',periodInMinutes:1}),onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])},get:async()=>({id:1,url:'https://chatgpt.com/c/a'}),sendMessage:async()=>({ok:true,versions:[],artifacts:[],hasSubmittedStepToken:false})},storage:{local:{get:async()=>({}),set:async()=>{}}}};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();},clearTimeout(){},setInterval(){},clearInterval(){},Map,Set,Promise,Date,Math,crypto:{randomUUID:()=> 'uuid'},importScripts(){}};
vm.createContext(context); vm.runInContext(source,context);
const state={
 plan:[{text:'Exact approved step'}], stepIndex:0, planId:'plan-1', runId:'run-1', currentStepId:'step-01', currentStepToken:'token-1',
 protocolMode:'signature_v2', lastArtifactSha256:null, titanZeroContext:'# Titan evidence\n- safe fact'
};
const out=context.buildPrompt(state);
assert(out.startsWith('Please implement Step 1: Exact approved step'),'approved text must remain first');
const contextPos=out.indexOf('TITAN ZERO HOST CONTEXT — READ-ONLY EVIDENCE');
const contractPos=out.indexOf('CODEE COMPLETION CONTRACT — REQUIRED FOR THIS CODE ZIP');
const readyPos=out.lastIndexOf('CODEE_ARTIFACT_READY');
assert(contextPos>0,'Titan context must be present');
assert(contractPos>contextPos,'CODEE completion contract must follow read-only context');
assert(readyPos>contractPos,'ready sentinel must follow completion contract');
assert.strictEqual(out.trim().endsWith('CODEE_ARTIFACT_READY'),true,'CODEE completion sentinel must remain the final prompt content');
console.log('Titan Zero context precedes the final CODEE completion contract');
