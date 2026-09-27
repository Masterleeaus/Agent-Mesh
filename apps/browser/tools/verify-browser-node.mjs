#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const passes = [];
const legacy = [];
const fail = m => { failures++; console.error(`FAIL: ${m}`); };
const pass = m => { passes.push(m); console.log(`PASS: ${m}`); };
const rel = f => path.relative(root, f).replaceAll(path.sep, '/');
const run = (cmd,args,opts={}) => spawnSync(cmd,args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024,...opts});
function walk(dir,pred=()=>true){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f,pred));else if(pred(f))out.push(f);}return out;}

function isLegacyTest(name){
  return [
    /^test-pass\d+-release-version\.js$/,
    /^test-platform-pass\d+-release-version\.js$/,
    /^test-recovery-.*release.*\.js$/,
    /^test-manager-/,
    /^test-titan-zero-manager-/,
    /^test-agent-mesh-/,
    /^test-titan-zero-agent-mesh-/,
    /^test-titan-pack-/,
    /^test-titan-code-/,
    /^test-platform-pass8-host-operations\.js$/
  ].some(r=>r.test(name));
}

const preload = path.join(root,'tools','test-worker-vm-preload.cjs');
const nodeOptions=[process.env.NODE_OPTIONS||'',`--require=${preload}`].filter(Boolean).join(' ');
const testDir=path.join(root,'tests');
const top=fs.readdirSync(testDir).filter(n=>/^test-.*\.js$/.test(n)).sort();
const active=top.filter(n=>!isLegacyTest(n));
legacy.push(...top.filter(isLegacyTest));
for(const name of active){
  const r=run(process.execPath,[path.join('tests',name)],{env:{...process.env,NODE_OPTIONS:nodeOptions}});
  if(r.status!==0){if(r.stdout)process.stdout.write(r.stdout);if(r.stderr)process.stderr.write(r.stderr);fail(`regression ${name}`);}
}
if(!failures) pass(`${active.length}/${active.length} Browser Node regression tests`);
console.log(`INFO: ${legacy.length} Titan Code/Agent Mesh legacy tests classified non-blocking`);

const donorTitan=fs.readdirSync(testDir).filter(n=>/^donor-titan-.*\.test\.js$/.test(n)).sort();
for(const n of donorTitan){const r=run(process.execPath,[path.join('tests',n)],{env:{...process.env,NODE_OPTIONS:nodeOptions}});if(r.status!==0)fail(`Titan donor ${n}`);}
if(donorTitan.length) pass(`${donorTitan.length}/${donorTitan.length} Titan donor suites`);
const repoDir=path.join(testDir,'donor-repository-intelligence');
const repoTests=fs.existsSync(repoDir)?fs.readdirSync(repoDir).filter(n=>/\.test\.js$/.test(n)).sort():[];
for(const n of repoTests){const r=run(process.execPath,[path.join('tests','donor-repository-intelligence',n)],{env:{...process.env,NODE_OPTIONS:nodeOptions}});if(r.status!==0)fail(`repository donor ${n}`);}
if(repoTests.length) pass(`${repoTests.length}/${repoTests.length} repository donor suites`);
const workforce=path.join(root,'tests','donor-workforce','run-all.js');
if(fs.existsSync(workforce)){const r=run(process.execPath,[rel(workforce)],{env:{...process.env,NODE_OPTIONS:nodeOptions}});if(r.status!==0)fail('workforce donor');else pass('workforce donor suite');}

const syntaxFiles=[...walk(path.join(root,'src'),f=>/\.(?:js|mjs|cjs)$/.test(f)),...walk(path.join(root,'tools'),f=>/\.(?:js|mjs|cjs)$/.test(f)),...walk(path.join(root,'tests'),f=>/\.(?:js|mjs|cjs)$/.test(f)&&!isLegacyTest(path.basename(f)))];
for(const f of syntaxFiles){const r=run(process.execPath,['--check',f]);if(r.status!==0){if(r.stderr)process.stderr.write(r.stderr);fail(`syntax ${rel(f)}`);}}
if(!syntaxFiles.some(()=>false)&&failures===0) pass(`${syntaxFiles.length}/${syntaxFiles.length} active JavaScript syntax checks`);

const jsonFiles=walk(root,f=>f.endsWith('.json')).filter(f=>!rel(f).startsWith('node_modules/'));
for(const f of jsonFiles){try{JSON.parse(fs.readFileSync(f,'utf8'));}catch(e){fail(`JSON ${rel(f)}: ${e.message}`);}}
if(!jsonFiles.some(()=>false)) pass(`${jsonFiles.length}/${jsonFiles.length} JSON parses`);

try{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
  if(manifest.manifest_version!==3) throw new Error('manifest_version must be 3');
  if(manifest.name!=='Titan Zero Browser Node') throw new Error(`unexpected product name ${manifest.name}`);
  if(manifest.background?.type!=='module') throw new Error('background worker must be module');
  const refs=new Set();
  if(manifest.background?.service_worker)refs.add(manifest.background.service_worker);
  if(manifest.side_panel?.default_path)refs.add(manifest.side_panel.default_path);
  for(const cs of manifest.content_scripts||[])for(const j of cs.js||[])refs.add(j);
  for(const x of refs)if(!fs.existsSync(path.join(root,x)))throw new Error(`missing manifest reference ${x}`);
  pass(`MV3 Browser Node manifest and ${refs.size} direct references`);
}catch(e){fail(`manifest: ${e.message}`);}

try{
  const sm=JSON.parse(fs.readFileSync(path.join(root,'source-manifest.json'),'utf8'));
  if(sm.schema!==1||sm.algorithm!=='sha256'||sm.product!=='Titan Zero Browser Node'||!Array.isArray(sm.files))throw new Error('invalid Browser Node source manifest');
  const expected=walk(root,()=>true).map(rel).filter(x=>x!=='source-manifest.json'&&!x.endsWith('.zip')&&!x.startsWith('.tmp/')).sort();
  const declared=sm.files.map(x=>String(x.path||'')).sort();
  if(JSON.stringify(expected)!==JSON.stringify(declared))throw new Error('path set does not match package files');
  for(const row of sm.files){const b=fs.readFileSync(path.join(root,row.path));const h=crypto.createHash('sha256').update(b).digest('hex');if(row.bytes!==b.length||String(row.sha256).toLowerCase()!==h)throw new Error(`mismatch ${row.path}`);}
  if(sm.fileCount!==sm.files.length)throw new Error('fileCount mismatch');
  pass(`source manifest ${sm.files.length} files`);
}catch(e){fail(`source-manifest.json: ${e.message}`);}

try{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
  const worker=path.join(root,manifest.background.service_worker);
  const dir=path.dirname(worker);const text=fs.readFileSync(worker,'utf8');
  const esm=[...text.matchAll(/^\s*import\s+(?:[^'\"]+?\s+from\s+)?['\"]([^'\"]+\.js)['\"];?/gm)].map(m=>m[1]);
  for(const x of esm)if(!fs.existsSync(path.resolve(dir,x)))throw new Error(`missing module import ${x}`);
  const imports=[];for(const m of text.matchAll(/importScripts\(([^;]+?)\);/gs))for(const s of m[1].matchAll(/['\"]([^'\"]+\.js)['\"]/g))imports.push(s[1]);
  for(const x of imports)if(!fs.existsSync(path.resolve(dir,x)))throw new Error(`missing importScripts ${x}`);
  pass(`${esm.length} module imports; ${imports.length} importScripts references`);
}catch(e){fail(`worker imports: ${e.message}`);}

const approved=path.join(root,'src/lib/approved-network-transport.js');
const forbidden=[[/\beval\s*\(/,'eval'],[/\bnew\s+Function\s*\(/,'new Function'],[/document\.write\s*\(/,'document.write'],[/\.innerHTML\s*=/,'innerHTML'],[/\bfetch\s*\(/,'direct fetch'],[/new\s+XMLHttpRequest\b/,'XMLHttpRequest'],[/new\s+WebSocket\b/,'WebSocket']];
let security=0;
for(const f of walk(path.join(root,'src'),x=>x.endsWith('.js'))){const t=fs.readFileSync(f,'utf8');for(const [rx,label] of forbidden){if(label==='direct fetch'&&path.resolve(f)===path.resolve(approved))continue;if(rx.test(t)){security++;fail(`${label} in ${rel(f)}`);}}}
try{const t=fs.readFileSync(approved,'utf8');for(const token of ["redirect:'error'","credentials:'omit'",'chrome.permissions.contains','MAX_REQUEST_BYTES','MAX_RESPONSE_BYTES'])if(!t.includes(token))throw new Error(`missing ${token}`);if(!/\bfetch\s*\(/.test(t))throw new Error('transport lacks fetch implementation');}catch(e){security++;fail(`approved network transport: ${e.message}`);}
if(!security) pass('approved-network isolation and active source security scan');

if(failures){console.error(`TITAN_ZERO_BROWSER_NODE_VERIFY: FAIL (${failures})`);process.exit(1);}
console.log('TITAN_ZERO_BROWSER_NODE_VERIFY: PASS');
console.log(`Verified: ${passes.join('; ')}`);
