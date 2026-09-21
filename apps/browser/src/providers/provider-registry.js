(function attachCodeeProviderRegistry(global){
'use strict';
function freezeArray(value){return Object.freeze((Array.isArray(value)?value:[]).slice());}
function freezeAdapter(adapter){return Object.freeze({...adapter,hosts:freezeArray(adapter.hosts),newChatPatterns:freezeArray(adapter.newChatPatterns),composerSelectors:freezeArray(adapter.composerSelectors),submitSelectors:freezeArray(adapter.submitSelectors),userMessageSelectors:freezeArray(adapter.userMessageSelectors),assistantMessageSelectors:freezeArray(adapter.assistantMessageSelectors),streamingSelectors:freezeArray(adapter.streamingSelectors),loggedOutSelectors:freezeArray(adapter.loggedOutSelectors),artifactSelectors:freezeArray(adapter.artifactSelectors)});}
const ADAPTERS=Object.freeze([
 freezeAdapter({id:'chatgpt',label:'ChatGPT',hosts:['chatgpt.com'],conversationPattern:/^\/c\/([^/?#]+)/i,newChatPatterns:[/^\/?$/],composerSelectors:['#prompt-textarea','[data-testid="prompt-textarea"]','textarea[name="prompt-textarea"]','[data-testid="composer-text-input"]'],submitSelectors:['#composer-submit-button','button[data-testid="send-button"]','button[aria-label="Send prompt"]','button[aria-label*="Send" i]'],userMessageSelectors:['[data-message-author-role="user"]'],assistantMessageSelectors:['[data-message-author-role="assistant"]'],streamingSelectors:['button[aria-label*="Stop" i]']}),
 freezeAdapter({id:'claude',label:'Claude',hosts:['claude.ai'],conversationPattern:/^\/chat\/([^/?#]+)/i,newChatPatterns:[/^\/?$/,/^\/new\/?$/i],composerSelectors:['[contenteditable="true"][data-lexical-editor="true"]','div[role="textbox"][contenteditable="true"]'],submitSelectors:['button[aria-label*="Send" i]','button[data-testid*="send" i]'],userMessageSelectors:['[data-testid*="user-message" i]','[data-is-user-message="true"]'],assistantMessageSelectors:['[data-testid*="assistant-message" i]','[data-is-assistant-message="true"]'],streamingSelectors:['button[aria-label*="Stop" i]']})
]);
function hostMatches(host,allowed){const h=String(host||'').toLowerCase();return h===allowed||h.endsWith('.'+allowed);}
function forUrl(url){try{const parsed=new URL(String(url||''));return ADAPTERS.find(a=>a.hosts.some(h=>hostMatches(parsed.hostname,h)))||null;}catch{return null;}}
function structuredIdentity(url){try{const parsed=new URL(String(url||''));const adapter=forUrl(parsed.href);if(!adapter)return'';const m=parsed.pathname.match(adapter.conversationPattern);return m?`${adapter.id}:${m[1]}`:'';}catch{return'';}}
function isNewChatUrl(url){try{const parsed=new URL(String(url||''));const adapter=forUrl(parsed.href);return Boolean(adapter&&adapter.newChatPatterns.some(r=>r.test(parsed.pathname)));}catch{return false;}}
function list(){return ADAPTERS.slice();}
function get(id){return ADAPTERS.find(a=>a.id===String(id||''))||null;}
global.CodeeProviderRegistry=Object.freeze({list,get,forUrl,structuredIdentity,isNewChatUrl});
})(typeof globalThis!=='undefined'?globalThis:this);
