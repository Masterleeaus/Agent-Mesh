<?php
declare(strict_types=1);
$path = dirname(__DIR__) . '/resources/workforce/workforce-integration.json';
if (!is_file($path)) { fwrite(STDERR, "missing workforce integration\n"); exit(1); }
$d = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
$checks = [
    ($d['schema'] ?? null) === 'titan.workforce.extension-integration.v1',
    ($d['provider']['extension_key'] ?? null) === 'titan-maps-intelligence',
    ($d['tenancy']['canonical_key'] ?? null) === 'company_id',
    ($d['ownership']['workforce_identity_owner'] ?? null) === 'titan-ai-workforce',
    ($d['ownership']['extension_owns_roles'] ?? true) === false,
    ($d['ownership']['extension_owns_work_items'] ?? true) === false,
    ($d['availability']['installed_does_not_imply_available'] ?? false) === true,
    ($d['availability']['available_does_not_imply_authorized'] ?? false) === true,
    ($d['tools']['read_operations_are_non_mutating'] ?? false) === true,
    ($d['tools']['command_bus_required_for_state_writes'] ?? false) === true,
    ($d['governance']['effective_authority_owner'] ?? null) === 'titan-autonomy',
];
foreach ($checks as $ok) { if (!$ok) { fwrite(STDERR, "workforce integration contract failed\n"); exit(1); } }
echo "WORKFORCE_INTEGRATION_CONTRACT: PASS (" . count($checks) . "/" . count($checks) . ")\n";
