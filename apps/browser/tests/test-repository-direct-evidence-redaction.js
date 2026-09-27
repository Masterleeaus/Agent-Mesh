const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);
for(const f of ['src/repository/repository-policy.js','src/repository/diff-engine.js','src/repository/error-classifier.js']) vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const diff=c.CodeeDiffEngine.diff("token='old-secret'\nconst x=1", "token='new-secret'\nconst x=2");
const d=JSON.stringify(diff);assert(!d.includes('old-secret')&&!d.includes('new-secret'),'diff evidence must redact secrets');assert(d.includes('[redacted]'));
const error=c.CodeeErrorClassifier.classify("Authorization: Bearer abc.def.secret SQLSTATE[23000] constraint failed");
const e=JSON.stringify(error);assert(!e.includes('abc.def.secret'),'classified error summary must redact credentials');assert(e.includes('[redacted]'));
console.log('Repository direct diff/error evidence is redacted');
