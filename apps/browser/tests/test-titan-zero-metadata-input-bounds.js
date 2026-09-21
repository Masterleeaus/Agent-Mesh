const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={console,Map,Set,Object,Array,String,Number,Boolean,RegExp,JSON,Math,Date};c.globalThis=c;vm.createContext(c);
vm.runInContext(fs.readFileSync('src/lib/capability-registry.js','utf8'),c);
// Only snapshot sanitization dependencies are needed for this test.
vm.runInContext(fs.readFileSync('src/titan-zero/titan-zero-snapshot-policy.js','utf8'),c);
vm.runInContext(fs.readFileSync('src/lib/titan-zero-host-integration.js','utf8'),c);
const huge='x'.repeat(20000);
const safe=c.CodeeTitanZeroHostIntegration.sanitizeSnapshot({files:{'routes/web.php':'<?php'},navigation:[{id:1,title:huge,url:'/admin?token=SUPER_SECRET#frag',route:huge}],permissions:[]});
assert(safe.navigation[0].title.length<=c.CodeeTitanZeroHostIntegration.SNAPSHOT_LIMITS.maxNavigationValueChars,'navigation values must be bounded');
assert(safe.navigation[0].route.length<=c.CodeeTitanZeroHostIntegration.SNAPSHOT_LIMITS.maxNavigationValueChars,'route metadata must be bounded');
assert.strictEqual(safe.navigation[0].url,'/admin','navigation URLs must discard query/fragment values');
assert.strictEqual(c.CodeeTitanZeroHostIntegration.shouldIncludePath(`routes/${'a'.repeat(5000)}.php`),false,'absurdly long paths must be rejected');
console.log('Titan Zero metadata inputs are bounded and URL query secrets are stripped');
