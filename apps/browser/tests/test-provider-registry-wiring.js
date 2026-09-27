const fs=require('fs'),vm=require('vm'),assert=require('assert');
assert(fs.existsSync('src/providers/provider-registry.js'),'provider registry module must exist');
const c={URL};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/providers/provider-registry.js','utf8'),c);
const r=c.CodeeProviderRegistry;assert(r);
const g=r.forUrl('https://chatgpt.com/c/abc');const cl=r.forUrl('https://claude.ai/chat/xyz');assert(g&&cl);assert.strictEqual(g.id,'chatgpt');assert.strictEqual(cl.id,'claude');

assert(Object.isFrozen(g.composerSelectors));assert(Object.isFrozen(g.submitSelectors));assert(Object.isFrozen(g.userMessageSelectors));assert(Object.isFrozen(g.assistantMessageSelectors));assert(Object.isFrozen(g.streamingSelectors),'provider streaming selectors must be immutable');assert(Object.isFrozen(g.newChatPatterns),'provider new-chat patterns must be immutable');
assert(!g.composerSelectors.some(x=>/^textarea$|^\[contenteditable/.test(x)),'ChatGPT must not use generic composer fallback');
const content=fs.readFileSync('src/content-script.js','utf8');assert(/async function sendPromptToProvider\b/.test(content),'content script must use provider-neutral send entry point');
const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));const js=manifest.content_scripts.flatMap(x=>x.js||[]);assert(js.includes('src/providers/provider-registry.js'));console.log('provider registry wiring OK');
