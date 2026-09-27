const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/content-script.js','utf8');let listener;let userMessages=[];
const input={contentEditable:'true',textContent:'',disabled:false,getAttribute(){return null},dispatchEvent(){},closest(){return null},parentElement:null};
const button={disabled:false,getAttribute(){return null},click(){input.textContent='';}};
const document={querySelector(sel){if(sel.includes('send-button')||sel.includes('Send'))return button;if(sel==='#prompt-textarea')return input;return null;},querySelectorAll(sel){if(sel.includes('user'))return userMessages;return [];},contains(){return true},body:{textContent:''},documentElement:{textContent:''}};
const chrome={runtime:{id:'x',onMessage:{addListener(fn){listener=fn}},sendMessage:async()=>({ok:true})}};
const location={href:'https://chatgpt.com/c/abc',hostname:'chatgpt.com'};
const c={chrome,document,location,window:{location},console:{log(){},warn(){},error(){}},setInterval:()=>1,clearInterval(){},setTimeout(fn){fn();return 1},clearTimeout(){},MutationObserver:undefined,URL,Map,Set,WeakSet,Promise,Date,Math,Event:function(t){return{type:t}},KeyboardEvent:function(t){return{type:t}},crypto:{randomUUID:()=> 'x'}};c.globalThis=c;vm.createContext(c);vm.runInContext(source,c);
function send(token){return new Promise(resolve=>listener({action:'SEND_PROMPT',prompt:`hello\nSTEP_TOKEN: ${token}`,stepToken:token},{},resolve));}
(async()=>{
 let r=await send('tok-clear-only');assert.strictEqual(r.ok,false,'composer clearing alone must not acknowledge submission');
 userMessages=[{textContent:'hello\nSTEP_TOKEN: tok-real'}];r=await send('tok-real');assert.strictEqual(r.ok,true,'exact token in a new provider user-message must acknowledge submission');
 console.log('positive user-message prompt acknowledgement OK');
})().catch(e=>{console.error(e);process.exit(1)});
