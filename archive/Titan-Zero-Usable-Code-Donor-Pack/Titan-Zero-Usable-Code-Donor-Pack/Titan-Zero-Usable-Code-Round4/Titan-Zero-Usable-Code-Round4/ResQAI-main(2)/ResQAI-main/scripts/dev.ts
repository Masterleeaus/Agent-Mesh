import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apps = ['support-queue', 'ops-dashboard', 'appointment-board', 'resolution-center', 'crm-tracker'];
const target = process.argv[2];

if (!target) {
  console.log('Available apps:');
  apps.forEach((a) => console.log(`  ${a}`));
  console.log('Usage: npx tsx scripts/dev.ts <app-name>');
  process.exit(0);
}

if (!apps.includes(target)) {
  console.error(`Unknown app: ${target}. Available: ${apps.join(', ')}`);
  process.exit(1);
}

// Inject Lemma CLI token from root .env if VITE_LEMMA_TOKEN is not already set
if (!process.env.VITE_LEMMA_TOKEN) {
  const dotenvPath = resolve(__dirname, '..', '.env');
  if (existsSync(dotenvPath)) {
    const dotenvContent = readFileSync(dotenvPath, 'utf-8');
    const match = dotenvContent.match(/^VITE_LEMMA_TOKEN=(.+)$/m);
    if (match) {
      process.env.VITE_LEMMA_TOKEN = match[1].trim();
    }
  }
}

if (process.env.VITE_LEMMA_TOKEN) {
  console.log('VITE_LEMMA_TOKEN found — auth will use injected token (bypasses OAuth).');
} else {
  console.log('No VITE_LEMMA_TOKEN found. To bypass OAuth on localhost, set VITE_LEMMA_TOKEN in .env');
  console.log('  (get a token via: lemma token | clip)');
}

console.log(`Starting dev server for ${target}...`);

execSync('npx vite', {
  cwd: `apps/${target}`,
  stdio: 'inherit',
  env: { ...process.env, VITE_LEMMA_TOKEN: process.env.VITE_LEMMA_TOKEN || '' },
});
