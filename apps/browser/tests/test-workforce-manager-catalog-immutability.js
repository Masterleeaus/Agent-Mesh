const assert=require('assert');const {load}=require('./_workforce-test-loader');const g=load();
const m=g.CodeeManagerRegistry.get('laravel-manager');
assert(Object.isFrozen(m));assert(Object.isFrozen(m.tags));assert(Object.isFrozen(m.tools));assert(Object.isFrozen(m.permissions));assert(Object.isFrozen(m.autonomy));
const before=[...m.tags];try{m.tags.push('evil')}catch{}assert.deepStrictEqual([...g.CodeeManagerRegistry.get('laravel-manager').tags],before);
console.log('workforce manager catalog deep immutability OK');
