const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);for(const f of ['src/repository/repository-policy.js','src/repository/repository-search.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const snap={files:{'app/A.php':'','app/B.php':'','app/C.php':'','routes/web.php':''}};
assert.deepStrictEqual(Array.from(c.CodeeRepositorySearch.paths(snap,'^app/')),['app/A.php','app/B.php','app/C.php']);
assert.deepStrictEqual(Array.from(c.CodeeRepositorySearch.paths(snap,/^app\//g)),['app/A.php','app/B.php','app/C.php']);
console.log('Repository path regex stability OK');
