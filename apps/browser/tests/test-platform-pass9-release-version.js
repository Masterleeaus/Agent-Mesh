const fs=require('fs'),assert=require('assert');
function v(s){return String(s).split('.').map(Number)} function gte(a,b){for(let i=0;i<3;i++){if(a[i]>b[i])return true;if(a[i]<b[i])return false}return true}
assert(gte(v(JSON.parse(fs.readFileSync('manifest.json')).version),v('2.10.0')));
assert(gte(v(JSON.parse(fs.readFileSync('package.json')).version),v('2.10.0')));
const readme=fs.readFileSync('README.md','utf8'); assert(readme.includes('Platform Pass 9')); console.log('PASS platform pass9 release history');
