#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? process.cwd());
const scanRoot = path.join(root, 'apps', 'web');
const excluded = /(?:__tests__|\.test\.|\.spec\.|\.integration\.test\.)/;
const hits = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:ts|tsx)$/.test(entry.name) && !excluded.test(full)) inspect(full);
  }
}

function inspect(file) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  for (const [kind, re] of [
    ['withDbSession', /\bwithDbSession\s*\(/g],
    ['set_config', /\bset_config\s*\(/g],
  ]) {
    let m;
    while ((m = re.exec(text))) {
      const line = text.slice(0, m.index).split('\n').length;
      hits.push({ kind, path: rel, line });
    }
  }
}

walk(scanRoot);
const runtimeWithDbSession = hits.filter(h => h.kind === 'withDbSession' && h.path !== 'apps/web/lib/db.ts');
const directSetConfig = hits.filter(h => h.kind === 'set_config' && h.path !== 'apps/web/lib/db.ts' && h.path !== 'apps/web/lib/db/portable.ts');
const report = {
  generated_at: new Date().toISOString(),
  scope: 'apps/web runtime TypeScript/TSX excluding tests',
  summary: {
    runtime_withDbSession_calls: runtimeWithDbSession.length,
    runtime_withDbSession_files: new Set(runtimeWithDbSession.map(h => h.path)).size,
    direct_set_config_calls_outside_db_adapters: directSetConfig.length,
    direct_set_config_files_outside_db_adapters: new Set(directSetConfig.map(h => h.path)).size,
  },
  runtime_withDbSession: runtimeWithDbSession,
  direct_set_config_outside_db_adapters: directSetConfig,
};
const out = path.join(root, 'artifacts', 'db-session-portability-report.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.summary));
console.log(out);
