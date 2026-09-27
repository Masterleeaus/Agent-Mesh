const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);
for(const f of ['src/titan-zero/titan-zero-snapshot-policy.js','src/titan-zero/titan-zero-php-architecture.js']) vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const uses=Array.from({length:5000},(_,i)=>`use App\\Contracts\\C${i};`).join('\n');
const deps=Array.from({length:3000},(_,i)=>`C${i} $c${i}`).join(', ');
const binds=Array.from({length:5000},(_,i)=>`$this->app->bind(C${i}::class, I${i}::class);`).join('\n');
const files={
  'app/Http/Controllers/HugeController.php':`${uses}\nclass HugeController { public function __construct(${deps}){} }`,
  'app/Providers/HugeProvider.php':`class HugeProvider { function register(){ ${binds} } }`
};
const r=c.CodeeTitanZeroPhpArchitecture.analyze(files);
assert(r.nodes[0].uses.length<=1000,'uses per file must be bounded');
assert(r.nodes[0].constructorDependencies.length<=500,'constructor deps per file must be bounded');
assert(r.containerBindings.length<=1000,'container bindings must be bounded');
assert(r.dependencyEdges.length<=20000,'dependency edges must be bounded');
assert.strictEqual(r.truncated,true,'bounded architecture analysis must expose truncation');
console.log('Titan PHP architecture output is bounded');
