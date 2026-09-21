import { execSync } from 'child_process';

const FUNCTION_DIRS = [
  'account-health-scan',
  'assign-appointment-technician',
  'check-ticket-urgency',
  'collect-resolved-tickets',
  'finalize-dispatch',
  'finalize-slippage-review',
  'flag-slipping-followups',
  'resolve-dispute',
  'update-account-health-status',
  'update-ticket-record',
];

console.log('Running support-queue tests...');
try {
  execSync('cd apps/support-queue && npx vitest run', { stdio: 'inherit' });
  console.log('  \u2713 App tests passed');
} catch {
  console.error('  \u2717 App tests failed');
}

let funcTestsPassed = true;
console.log('Running function tests...');
for (const dir of FUNCTION_DIRS) {
  try {
    execSync(`cd functions/${dir} && python -m pytest tests/ --cov=src --cov-report=term-missing`, { stdio: 'inherit' });
    console.log(`  \u2713 ${dir} passed`);
  } catch {
    console.error(`  \u2717 ${dir} failed`);
    funcTestsPassed = false;
  }
}
if (funcTestsPassed) {
  console.log('  \u2713 Function tests passed');
} else {
  console.error('  \u2717 Function tests failed');
}

// Run all function suites together for the aggregate coverage report
try {
  console.log('Running aggregate coverage...');
  execSync(
    `cd functions && python -m pytest `
      + FUNCTION_DIRS.map(d => `${d}/tests/`).join(' ')
      + ` --cov --cov-report=term --cov-report=xml:../coverage.xml`,
    { stdio: 'inherit' }
  );
  console.log('  \u2713 Aggregate coverage report generated');
} catch {
  console.error('  \u2717 Aggregate coverage report failed');
}
