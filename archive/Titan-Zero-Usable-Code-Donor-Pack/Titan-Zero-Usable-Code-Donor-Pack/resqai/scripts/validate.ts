import { execSync } from 'child_process';

const apps = ['support-queue', 'ops-dashboard', 'appointment-board', 'resolution-center', 'crm-tracker'];
let allPassed = true;

apps.forEach((app) => {
  try {
    console.log(`Validating ${app}...`);
    execSync(`cd apps/${app} && npx tsc --noEmit`, { stdio: 'inherit' });
    console.log(`  ✓ ${app} passed`);
  } catch {
    console.error(`  ✗ ${app} failed`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('All apps validated successfully.');
} else {
  console.error('Some apps failed validation.');
  process.exit(1);
}
