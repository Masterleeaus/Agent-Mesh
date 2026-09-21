const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);
for(const f of ['src/repository/command-policy.js','src/titan-zero/titan-zero-command-catalog.js']) vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
for(const item of c.CodeeTitanZeroCommandCatalog.COMMANDS){
 const mode=item.executionMode||'safe_channel';
 if(mode!=='safe_channel') continue;
 const classification=c.CodeeCommandPolicy.classify(item.command);
 assert(!['UNKNOWN','INVALID','DESTRUCTIVE'].includes(classification.class),`${item.id} must be executable by the declared safe channel`);
 assert.strictEqual(Boolean(classification.requiresBackup),Boolean(item.mutating),`${item.id} mutation metadata must match policy`);
}
for(const command of ['php artisan config:clear','php artisan route:clear','php artisan view:clear']){
 const cfn=c.CodeeCommandPolicy.classify(command);assert.strictEqual(cfn.class,'WRITE');assert.strictEqual(cfn.requiresBackup,true);
}
const syntax=c.CodeeTitanZeroCommandCatalog.COMMANDS.find(x=>x.id==='php-syntax');assert.strictEqual(syntax.executionMode,'external_shell');
console.log('Titan command catalog matches Codee command-governance policy');
