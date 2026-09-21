const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/repository/repository-policy.js','utf8'),c);
const samples=[
 'const token = "super-secret-token";',
 "password='p@ssw0rd';",
 '{"api_key":"json-secret","safe":"ok"}',
 'client_secret: "client-secret-value"',
 'authorization = \'Basic abc123\'',
 'url="https://example.test/cb?token=url-secret"'
];
for(const sample of samples){const out=c.CodeeRepositoryPolicy.redactText(sample);assert(!/super-secret-token|p@ssw0rd|json-secret|client-secret-value|Basic abc123|url-secret/.test(out),`secret leaked from: ${sample}`);assert(out.includes('[redacted]'),`redaction marker missing for: ${sample}`);}
console.log('Repository quoted secret redaction OK');
