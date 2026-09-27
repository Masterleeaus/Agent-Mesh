<?php
declare(strict_types=1);
$root = dirname(__DIR__);
$w = json_decode((string) file_get_contents($root . '/resources/workforce/workforce-integration.json'), true, 512, JSON_THROW_ON_ERROR);
$e = json_decode((string) file_get_contents($root . '/resources/workforce/ecosystem-integration.json'), true, 512, JSON_THROW_ON_ERROR);
$expectedPeers = ['titan-field','crm','titan-assets'];
$checks = [
    ($w['tenancy']['canonical_key'] ?? null) === 'company_id',
    ($e['tenancy']['canonical_key'] ?? null) === 'company_id',
    ($e['coordination']['workforce_owner'] ?? null) === 'titan-ai-workforce',
    ($e['coordination']['authority_owner'] ?? null) === 'titan-autonomy',
    ($e['execution']['target_domain_owns_mutation'] ?? false) === true,
    ($e['execution']['command_gateway_required'] ?? false) === true,
    ($e['execution']['receipt_required'] ?? false) === true,
    ($e['safe_degradation']['offline'] ?? null) === 'never_increase_authority',
    count($e['handoffs'] ?? []) > 0,
    array_values($e['peers'] ?? []) === $expectedPeers,
    ($w['ecosystem']['rules']['cross_extension_state_writes_require_target_domain_command_gateway'] ?? false) === true,
    ($w['ecosystem']['rules']['signals_are_observations_not_commands'] ?? false) === true,
];
foreach ($checks as $ok) { if (!$ok) { fwrite(STDERR, "ecosystem integration contract failed\n"); exit(1); } }
echo "ECOSYSTEM_INTEGRATION_CONTRACT: PASS (" . count($checks) . "/" . count($checks) . ")\n";
