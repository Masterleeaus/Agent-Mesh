(function attachRepositoryPolicy(global){
'use strict';
const MAX_PATH_CHARS=1024;
const BLOCKED_BASENAMES=new Set(['.npmrc','.pypirc','id_rsa','id_ed25519','known_hosts']);
const BLOCKED_SEGMENTS=new Set(['.git','.ssh','credentials','secrets','private-keys','private_keys','credential-vault','credential_vault']);
const SKIP_BY_DEFAULT=new Set(['node_modules','vendor','.next','dist','build','coverage']);
const SECRET_EXTENSIONS=new Set(['.pem','.key','.p12','.pfx','.jks']);
function normalize(path){
 const raw=String(path||'').replaceAll('\\','/');
 if(/^[a-z]+:\/\//i.test(raw)) return raw;
 const absolute=raw.startsWith('/');
 const drive=raw.match(/^[A-Za-z]:\//)?.[0]||'';
 const body=drive?raw.slice(drive.length):absolute?raw.slice(1):raw;
 const parts=body.split('/').filter(part=>part!==''&&part!=='.');
 const normalized=parts.join('/');
 if(drive)return drive+normalized;
 return absolute?'/'+normalized:normalized;
}
function segments(path){return normalize(path).toLowerCase().split('/').filter(Boolean);}
function basename(path){const s=segments(path);return s[s.length-1]||'';}
function extension(path){const b=basename(path);const i=b.lastIndexOf('.');return i>=0?b.slice(i):'';}
function hasUnsafePath(path){const raw=String(path||'').replaceAll('\\','/');if(!raw||raw.length>MAX_PATH_CHARS||raw.includes('\0')||raw.startsWith('/')||/^[A-Za-z]:\//.test(raw)||/^[a-z]+:\/\//i.test(raw))return true;return raw.split('/').some(x=>x==='..');}
function isSensitive(path){const n=normalize(path).toLowerCase();const seg=segments(n);const base=basename(n);if(seg.some(x=>x==='.env'||x.startsWith('.env.')))return true;if(seg.some(x=>BLOCKED_BASENAMES.has(x)))return true;if(seg.some(x=>BLOCKED_SEGMENTS.has(x)))return true;if(SECRET_EXTENSIONS.has(extension(n)))return true;if(/(?:^|\/)(?:auth|oauth|session)[-_]?(?:token|cookies?)(?:\.|$)/i.test(n))return true;return false;}
function isInScope(path,options){const n=normalize(path);if(hasUnsafePath(path)||isSensitive(n))return false;if(options?.includeGenerated)return true;const seg=segments(n);return !seg.some(x=>SKIP_BY_DEFAULT.has(x));}
function classify(path){const n=normalize(path);const lower=n.toLowerCase();const ext=extension(n);let language='other';if(ext==='.php')language='php';else if(['.js','.mjs','.cjs','.jsx'].includes(ext))language='javascript';else if(['.ts','.tsx'].includes(ext))language='typescript';else if(ext==='.json')language='json';else if(['.md','.mdx'].includes(ext))language='markdown';else if(['.css','.scss','.sass'].includes(ext))language='css';else if(['.sql'].includes(ext))language='sql';else if(['.yml','.yaml'].includes(ext))language='yaml';
let domain='other';if(lower.startsWith('app/extensions/'))domain='extension';else if(lower.startsWith('app/'))domain='application';else if(lower.startsWith('routes/'))domain='routes';else if(lower.startsWith('database/'))domain='database';else if(lower.startsWith('resources/'))domain='frontend';else if(lower.startsWith('tests/'))domain='tests';else if(lower.startsWith('config/'))domain='config';
return {path:n,language,domain,sensitive:isSensitive(n),inScope:isInScope(n)};}
function redactText(text){return String(text??'')
 .replace(/(\bdocument\.cookie\s*=\s*)(["'])[^"'\r\n]*\2/ig,'$1$2[redacted]$2')
 .replace(/((?:localStorage|sessionStorage)\.setItem\(\s*["'][^"']*(?:token|secret|password|passwd|api[_-]?key|credential)[^"']*["']\s*,\s*)(["'])[^"'\r\n]*\2/ig,'$1$2[redacted]$2')
 .replace(/(Authorization\s*:\s*Basic\s+)[^\s\r\n]+/ig,'$1[redacted]')
 .replace(/((?:Set-)?Cookie\s*:\s*)[^\r\n]*/ig,'$1[redacted]')
 .replace(/(Bearer\s+)[A-Za-z0-9._~+\/-]+/ig,'$1[redacted]')
 .replace(/(\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|rediss|amqp|amqps):\/\/[^\s:@/"']+:)[^@\s/"']+(@)/ig,'$1[redacted]$2')
 .replace(/((?:["']?)(?:api[_-]?key|secret|password|passwd|token|authorization|client[_-]?secret|access[_-]?key|refresh[_-]?token)(?:["']?)\s*(?:=>|[:=])\s*)(["'])[^"'\r\n]*\2/ig,'$1$2[redacted]$2')
 .replace(/((?:api[_-]?key|secret|password|passwd|token|authorization|client[_-]?secret|access[_-]?key|refresh[_-]?token)\s*(?:=>|[:=])\s*)(?:Bearer\s+)?[^\s'"`]+/ig,'$1[redacted]')
 .replace(/(-----BEGIN [A-Z ]*PRIVATE KEY-----)[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----)/g,'$1\n[redacted]\n$2');}
global.CodeeRepositoryPolicy=Object.freeze({normalize,hasUnsafePath,isSensitive,isInScope,classify,redactText,MAX_PATH_CHARS,BLOCKED_BASENAMES:[...BLOCKED_BASENAMES],BLOCKED_SEGMENTS:[...BLOCKED_SEGMENTS],SKIP_BY_DEFAULT:[...SKIP_BY_DEFAULT]});
})(typeof globalThis!=='undefined'?globalThis:this);
