#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'source-manifest.json';
const EXCLUDED_DIRS = new Set(['.git', 'node_modules']);
function walk(dir) {
  const rows = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) rows.push(...walk(full));
    else {
      const rel = path.relative(root, full).replaceAll(path.sep, '/');
      if (rel === OUT || rel.endsWith('.zip') || rel.startsWith('.tmp/')) continue;
      rows.push({ rel, full });
    }
  }
  return rows;
}
const files = walk(root).sort((a,b)=>a.rel.localeCompare(b.rel)).map(({rel,full})=>{
  const bytes=fs.readFileSync(full);
  return { path:rel, bytes:bytes.length, sha256:crypto.createHash('sha256').update(bytes).digest('hex') };
});
const sourceDateEpoch = Number(process.env.SOURCE_DATE_EPOCH || 0);
const generatedAt = new Date(Number.isFinite(sourceDateEpoch) && sourceDateEpoch > 0 ? sourceDateEpoch * 1000 : 0).toISOString();
const manifest = {
  schema: 1,
  product: 'Titan Zero Browser Node',
  version: JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')).version,
  generatedAt,
  algorithm: 'sha256',
  excludes: [OUT, '*.zip', '.git/**', 'node_modules/**', '.tmp/**'],
  fileCount: files.length,
  files
};
fs.writeFileSync(path.join(root,OUT), JSON.stringify(manifest,null,2)+'\n');
console.log(`Wrote ${OUT} with ${files.length} files`);
