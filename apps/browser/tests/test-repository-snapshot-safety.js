const fs=require('fs'); const vm=require('vm'); const assert=require('assert');
const context={console:{log(){},warn(){},error(){}},Map,Set,Object,Array,String,Number,Boolean,RegExp,JSON,Math,Date}; context.globalThis=context; vm.createContext(context);
const load=f=>vm.runInContext(fs.readFileSync(f,'utf8'),context,{filename:f});
load('src/repository/repository-policy.js');
context.CodeeRepositoryCodingPack={analyze(){return {inventory:{files:0},symbols:{count:0},dependencies:{edges:[]},migrations:{findings:[]},packages:{},impact:{changed:[],impacted:[],risk:'none'},tests:{commands:[]},authority:{mayAdvancePlan:false}}}};
load('src/lib/repository-host-integration.js');
const safe=context.CodeeRepositoryHostIntegration.sanitizeSnapshot({files:{
  'app/Extensions/Crm/Services/LeadService.php':'<?php class LeadService {}',
  'app/Models/User.php':'<?php class User {}',
  '.env.staging':'API_KEY=SECRET',
  '../outside.php':'bad',
  'routes/../../.env':'SECRET=x',
  'C:/secrets.txt':'bad',
  'vendor/pkg/a.php':'generated'
}, logs:'[2026] prod.ERROR: Authorization: Bearer abc.def.ghi'});
assert(safe.files['app/Extensions/Crm/Services/LeadService.php']);
assert(safe.files['app/Models/User.php']);
assert(!safe.files['.env.staging']);
assert(!safe.files['../outside.php']);
assert(!safe.files['routes/../../.env']);
assert(!safe.files['C:/secrets.txt']);
assert(!safe.files['vendor/pkg/a.php']);
assert(!String(safe.logs||'').includes('abc.def.ghi'),'logs must be redacted');
assert.strictEqual(context.CodeeRepositoryPolicy.isInScope('app/Extensions/Crm/routes/web.php'),true);
assert.strictEqual(context.CodeeRepositoryPolicy.isInScope('.env.anything'),false);
console.log('Repository snapshot safety OK');
