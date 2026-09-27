const assert=require('assert');
require('./load-pack');
const host={calls:[],registerManager(x){this.calls.push(['manager',x])},registerPrompts(x){this.calls.push(['prompts',x])},registerSkills(x){this.calls.push(['skills',x])},registerProfiles(x){this.calls.push(['profiles',x])},registerContextProvider(x){this.calls.push(['context',x])},registerDiagnosticsSection(x){this.calls.push(['diag',x])},registerSettingsSection(x){this.calls.push(['settings',x])}};
const r=globalThis.CodeeWorkforceReceiverAdapter.register(host);
assert.strictEqual(r.createdTopLevelTabs,0);
assert.strictEqual(r.authority.planAdvance,false);
assert(host.calls.filter(x=>x[0]==='manager').length>=12);
console.log('integration PASS');
