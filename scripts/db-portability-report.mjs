#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const roots = ['apps/web', 'services/worker'];
const rules = [
  ['returning', /\bRETURNING\b/gi],
  ['pg_cast', /::(?:jsonb?|text|int|integer|uuid|date|timestamp|timestamptz)\b/gi],
  ['ilike', /\bILIKE\b/gi],
  ['on_conflict', /\bON\s+CONFLICT\b/gi],
  ['set_config', /\bset_config\s*\(/gi],
  ['current_setting', /\bcurrent_setting\s*\(/gi],
  ['skip_locked', /\bSKIP\s+LOCKED\b/gi],
  ['distinct_on', /\bDISTINCT\s+ON\s*\(/gi],
  ['interval_literal', /\bINTERVAL\s+'[^']+'/gi],
  ['jsonb_operator', /\bjsonb_[a-z_]+\s*\(|\s\|\|\s\$\d+::jsonb/gi],
];
const ignore = new Set(['node_modules','.next','dist','coverage']);
function walk(dir, out=[]) {
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    if (ignore.has(ent.name)) continue;
    const f=path.join(dir,ent.name);
    if (ent.isDirectory()) walk(f,out);
    else if (/\.(?:ts|tsx|js|mjs|sql)$/.test(ent.name)) out.push(f);
  }
  return out;
}
const findings=[];
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const text=fs.readFileSync(file,'utf8');
    const lines=text.split(/\r?\n/);
    for (let i=0;i<lines.length;i++) {
      for (const [kind,re] of rules) {
        re.lastIndex=0;
        if (re.test(lines[i])) findings.push({kind,file,line:i+1,text:lines[i].trim().slice(0,180)});
      }
    }
  }
}
const counts={}; for (const f of findings) counts[f.kind]=(counts[f.kind]||0)+1;
const report={generatedAt:new Date().toISOString(),target:'mysql/mariadb',portable:findings.length===0,totalFindings:findings.length,counts,findings};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/db-portability-report.json', JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({portable:report.portable,totalFindings:report.totalFindings,counts},null,2));
if (process.argv.includes('--strict') && findings.length) process.exit(2);
