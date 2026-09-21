const assert=require('assert');
require('./load-pack');
assert(globalThis.CodeeWorkforcePrompts.length>=28);
assert(globalThis.CodeeWorkforceSkills.length>=30);
assert(globalThis.CodeeWorkforceProfiles.length>=12);
const managers=globalThis.CodeeManagerCatalog;
for(const m of managers){assert(m.id&&m.role&&m.tools&&m.permissions&&m.risk);}
console.log('catalog PASS');
