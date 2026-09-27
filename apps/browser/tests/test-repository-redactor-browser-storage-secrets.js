const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/repository/repository-policy.js','utf8'),c);
const source=`document.cookie = 'sid=super-cookie'; localStorage.setItem('access_token','super-local'); sessionStorage.setItem("password", "super-session");`;
const redacted=c.CodeeRepositoryPolicy.redactText(source);
for(const secret of ['super-cookie','super-local','super-session'])assert(!redacted.includes(secret),`browser storage secret leaked: ${secret}`);
assert(redacted.includes('[redacted]'));
console.log('Repository redactor protects browser cookie/storage literals');
