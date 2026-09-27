const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/repository/repository-policy.js','utf8'),c);
const source=[
 'Authorization: Basic dXNlcjpwYXNz',
 'Cookie: session=supersecret; csrftoken=abc',
 'Set-Cookie: laravel_session=deadbeef; Path=/',
 'DATABASE_URL=postgres://alice:secretpass@db.example/test',
 'REDIS_URL="redis://default:hunter2@redis.example:6379"',
 'MONGO=mongodb+srv://bob:swordfish@cluster.example/db'
].join('\n');
const out=c.CodeeRepositoryPolicy.redactText(source);
for(const secret of ['dXNlcjpwYXNz','supersecret','deadbeef','secretpass','hunter2','swordfish'])assert(!out.includes(secret),`must redact ${secret}`);
assert(out.includes('[redacted]'));
console.log('Repository redactor covers Basic auth, cookies, and credential URLs');
