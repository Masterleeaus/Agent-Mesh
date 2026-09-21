const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};c.globalThis=c;vm.createContext(c);for(const f of ['src/repository/repository-policy.js','src/repository/symbol-index.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const r=c.CodeeSymbolIndex.build({files:{'resources/js/weird.js':'function constructor(){}\nfunction __proto__(){}\nfunction toString(){}'}});
assert.strictEqual(Object.getPrototypeOf(r.byName),null,'symbol byName index must be prototype-safe');
assert.strictEqual(r.byName.constructor.length,1);assert.strictEqual(r.byName.__proto__.length,1);assert.strictEqual(r.byName.toString.length,1);
console.log('Symbol index safely handles prototype-like symbol names');
