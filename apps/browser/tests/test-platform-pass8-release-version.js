const fs=require('fs'),assert=require('assert');
const v=JSON.parse(fs.readFileSync('manifest.json')).version.split('.').map(Number);
assert(v[0]>2 || (v[0]===2 && v[1]>=9),'current package must retain Pass 8 or later');
assert(fs.readFileSync('README.md','utf8').includes('Platform Pass 8'));
console.log('PASS platform pass8 release history retained');
