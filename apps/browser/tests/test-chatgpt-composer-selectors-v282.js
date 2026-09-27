const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/providers/provider-registry.js','utf8');
const c={URL,Object,Array,RegExp,String};c.globalThis=c;vm.createContext(c);vm.runInContext(source,c);
const chatgpt=c.CodeeProviderRegistry.get('chatgpt');
assert(chatgpt,'ChatGPT adapter must exist');
for(const selector of ['#prompt-textarea','[data-testid="prompt-textarea"]']){
  assert(chatgpt.composerSelectors.includes(selector),`ChatGPT composer fallback missing: ${selector}`);
}
assert(chatgpt.submitSelectors.includes('#composer-submit-button'),'current ChatGPT composer submit id should be supported');
assert(chatgpt.submitSelectors.includes('button[aria-label="Send prompt"]'),'current ChatGPT Send prompt aria-label should be supported');
console.log('ChatGPT 2026 composer selector fallbacks OK');
