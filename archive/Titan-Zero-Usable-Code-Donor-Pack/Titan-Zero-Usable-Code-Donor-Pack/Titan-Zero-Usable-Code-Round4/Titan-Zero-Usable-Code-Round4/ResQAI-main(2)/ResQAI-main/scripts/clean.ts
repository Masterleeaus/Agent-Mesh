import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const dirs = [
  'apps/support-queue/dist',
  'apps/ops-dashboard/dist',
  'apps/appointment-board/dist',
  'apps/resolution-center/dist',
  'apps/crm-tracker/dist',
  'apps/support-queue/node_modules/.vite',
  'apps/ops-dashboard/node_modules/.vite',
  'apps/appointment-board/node_modules/.vite',
  'apps/resolution-center/node_modules/.vite',
  'apps/crm-tracker/node_modules/.vite',
  'functions/account-health-scan/.pytest_cache',
  'functions/flag-slipping-followups/.pytest_cache',
  'functions/account-health-scan/src/__pycache__',
  'functions/flag-slipping-followups/src/__pycache__',
  'functions/account-health-scan/tests/__pycache__',
  'functions/flag-slipping-followups/tests/__pycache__',
  'functions/account-health-scan/tests/fixtures/__pycache__',
  'functions/flag-slipping-followups/tests/fixtures/__pycache__',
];

dirs.forEach((dir) => {
  const fullPath = join(process.cwd(), dir);
  if (existsSync(fullPath)) {
    rmSync(fullPath, { recursive: true, force: true });
    console.log(`Cleaned: ${dir}`);
  }
});

console.log('Clean complete.');
