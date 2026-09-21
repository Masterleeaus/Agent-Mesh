import { execSync } from 'child_process';

const apps = ['support-queue', 'ops-dashboard', 'appointment-board', 'resolution-center', 'crm-tracker'];
const target = process.argv[2];
let allPassed = true;

function buildApp(app: string): void {
  try {
    console.log(`Building ${app}...`);
    execSync(`cd apps/${app} && npx tsc --noEmit && npx vite build`, { stdio: 'inherit' });
    console.log(`  ✓ ${app} built`);
  } catch {
    console.error(`  ✗ ${app} build failed`);
    allPassed = false;
  }
}

if (target) {
  if (apps.includes(target)) buildApp(target);
  else {
    console.error(`Unknown app: ${target}. Available: ${apps.join(', ')}`);
    process.exit(1);
  }
} else {
  apps.forEach(buildApp);
  if (allPassed) {
    console.log('All apps built successfully.');
  } else {
    console.error('Some apps failed to build.');
    process.exit(1);
  }
}
