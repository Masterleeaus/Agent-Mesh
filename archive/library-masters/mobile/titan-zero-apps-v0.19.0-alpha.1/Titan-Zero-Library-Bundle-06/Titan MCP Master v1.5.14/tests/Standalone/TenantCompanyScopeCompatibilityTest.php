<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$manifest = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true, 512, JSON_THROW_ON_ERROR);
$workforce = json_decode((string) file_get_contents($root.'/workforce-integration.json'), true, 512, JSON_THROW_ON_ERROR);
$adapter = file_get_contents($root.'/System/Workforce/PackageWorkforceProviderAdapter.php');
$fail = static function (string $m): never { fwrite(STDERR, $m."\n"); exit(1); };
if (($manifest['data']['tenant_key'] ?? null) !== 'company_id') $fail('MCP authoritative data tenant key is not company_id.');
if (($manifest['data_governance']['tenant_key'] ?? null) !== 'company_id') $fail('MCP governance tenant key is not company_id.');
if (($manifest['concurrency']['idempotency_contract']['scope'] ?? null) !== 'company_id+operation_id') $fail('MCP idempotency scope is not company scoped.');
if (($workforce['tenant_key'] ?? null) !== 'company_id') $fail('MCP Workforce contract is not company_id scoped.');
if (str_contains($adapter, "['company_id', 'tenant_company_id']")) $fail('Authoritative package metadata still accepts tenant_company_id as a tenant key.');
if (!str_contains($adapter, "\$tenantKey !== 'company_id'")) $fail('Authoritative package metadata does not require company_id exactly.');
if (!str_contains($adapter, "return 'company_id'")) $fail('Runtime adapter does not normalize to company_id.');
echo "MCP company_id canonical scope compatibility: PASS\n";
