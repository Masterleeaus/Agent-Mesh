const fs=require('fs'),vm=require('vm'),assert=require('assert');
const store=new Map();const sessionStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))};
const chrome={runtime:{id:'ext',onMessage:{addListener(){}},sendMessage:async()=>({ok:true})}};
const location={href:'https://chatgpt.com/',hostname:'chatgpt.com'};
const document={querySelectorAll:()=>[],querySelector:()=>null,documentElement:null};
const c={chrome,location,window:{location},document,sessionStorage,globalThis:null,console:{log(){},warn(){},error(){}},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},MutationObserver:undefined,URL,Map,Set,WeakSet,Promise,Date,Math,Event:function(){},KeyboardEvent:function(){},crypto:{randomUUID:()=> 'provisional-123'}};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/content-script.js','utf8'),c);
const first=c.getConversationIdentitySnapshot();const second=c.getConversationIdentitySnapshot();assert.strictEqual(first.conversationIdentity,'chatgpt:page:new-chat:provisional-123');assert.strictEqual(second.conversationIdentity,first.conversationIdentity,'provisional identity must be stable in page session');
location.href='https://chatgpt.com/c/real-conversation';const promoted=c.getConversationIdentitySnapshot();assert.strictEqual(promoted.conversationIdentity,'chatgpt:real-conversation');assert.strictEqual(promoted.provisionalIdentity,'chatgpt:page:new-chat:provisional-123','structured identity must retain prior provisional identity for one-way promotion');
console.log('content script provisional identity is stable and promotable');
