<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$commands = [
    ['PHP verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/run.php')],
    ['Template catalogue verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/template_catalogue_run.php')],
    ['Assurance workflow verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/assurance_workflows_run.php')],
    ['Historical donor workflow regression verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/commerce_vertical_workflows_run.php')],
    ['LocalBrain v2 verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/local_intelligence_run.php')],
    ['Offline-only verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/offline_only_run.php')],
    ['Phase 1 extensionization verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/extension_contract.php')],
    ['Phase 1 tenancy verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/company_boundary.php')],
    ['Phase 2 offline security verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase2_offline_security.php')],
    ['Phase 3 tenancy/persistence verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/company_boundary.php')],
    ['Phase 3 CLI/lifecycle verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase3_cli_lifecycle.php')],
    ['Phase 4 capability/company-boundary verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/capability_execution.php')],
    ['Phase 5 field/home-services onboarding verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase5_field_services_onboarding.php')],
    ['Phase 5 onboarding runtime verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase5_onboarding_runtime.php')],
    ['Phase 5.1 hardening verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/security_hardening.php')],
    ['Phase 5.1 engine completeness verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase5_1_engine_completeness.php')],
    ['Phase 6 architecture/WorkCore-removal verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/architecture_contract.php')],
    ['Phase 6 router runtime verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_router_runtime.php')],
    ['Phase 6 provider routing verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_provider_routing.php')],
    ['Phase 6 authority verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_authority.php')],
    ['Phase 6 onboarding platform verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_onboarding_platform.php')],
    ['Phase 6 onboarding progress verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_onboarding_progress.php')],
    ['Phase 6 generic journey API verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_generic_journey_api.php')],
    ['Phase 6 surface security verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_surface_security.php')],
    ['Phase 6 generated UI verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_generated_ui.php')],
    ['Phase 6 offline Titan Go verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_offline_go.php')],
    ['Phase 6 vertical packs verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_vertical_packs.php')],
    ['Phase 6 secure connection verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_secure_connections.php')],
    ['Phase 6 health/readiness verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_health.php')],
    ['Phase 6 inventory verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/phase6_inventory.php')],
    ['Phase 6.1 settings verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/settings_contract.php')],
    ['Phase 6.2 installer/admin-menu verification', escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($root . '/tests/installer_admin_menu.php')],
];

if (commandExists('npm')) {
    $commands[] = ['TypeScript verification', 'npm test'];
}

foreach ($commands as [$label, $command]) {
    echo "\n== {$label} ==\n";
    passthru('cd ' . escapeshellarg($root) . ' && ' . $command, $status);
    if ($status !== 0) {
        fwrite(STDERR, "{$label} failed with status {$status}.\n");
        exit($status);
    }
}

echo "\nVerification complete.\n";

function commandExists(string $command): bool
{
    exec('command -v ' . escapeshellarg($command) . ' 2>/dev/null', $output, $status);
    return $status === 0 && $output !== [];
}
