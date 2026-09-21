import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

const dbDocsDir = join(process.cwd(), 'database/seeds');

if (!existsSync(dbDocsDir)) {
  console.error(`Seed data directory not found: ${dbDocsDir}`);
  process.exit(1);
}

const seedFiles = readdirSync(dbDocsDir).filter((f) => f.endsWith('.json'));

if (seedFiles.length === 0) {
  console.log('No seed data files found.');
  process.exit(0);
}

const tableMap: Record<string, string> = {};
console.log('Database seed data available:');
seedFiles.forEach((f) => {
  try {
    const raw = stripBom(readFileSync(join(dbDocsDir, f), 'utf-8'));
    const data = JSON.parse(raw);
    const isRecordsFile = f.endsWith('-records.json');
    const size = Array.isArray(data) ? data.length : (data.items?.length ?? 0);
    const table = f.replace(/-records\.json$/, '');
    if (isRecordsFile) {
      tableMap[f] = table;
      console.log(`  ${f} — ${size} records (table: ${table})`);
    }
  } catch (err) {
    console.error(`  ${f} — FAILED to read: ${err instanceof Error ? err.message : String(err)}`);
  }
});

const autoSeed = process.argv.includes('--exec');
if (autoSeed) {
  console.log('\nSeeding database...');
  seedFiles.forEach((f) => {
    const table = tableMap[f];
    if (!table) return;
    const filePath = join(dbDocsDir, f);
    try {
      execSync(`lemma records import "${table}" < "${filePath}"`, { stdio: 'inherit' });
      console.log(`  ✓ ${f} → ${table}`);
    } catch {
      console.error(`  ✗ ${f} → ${table} failed`);
    }
  });
} else {
  console.log('\nTo seed the database, run: npx tsx scripts/seed.ts --exec');
  console.log('Or manually: lemma records import <table> < <file>.json');
  console.log('Example: lemma records import tickets < database/seeds/tickets-records.json');
}
