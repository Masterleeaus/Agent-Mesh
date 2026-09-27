<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$adapter = (string) file_get_contents($root.'/System/Workforce/PackageWorkforceProviderAdapter.php');
$workforce = json_decode((string) file_get_contents($root.'/workforce-integration.json'), true, 512, JSON_THROW_ON_ERROR);
$fail = static function (string $message): never { fwrite(STDERR, $message."\n"); exit(1); };

if (($workforce['tenant_key'] ?? null) !== 'company_id') $fail('Workforce integration metadata is not company_id authoritative.');
if (! str_contains($adapter, "\$tenantKey !== 'company_id'")) $fail('Package loader does not require company_id exactly.');
if (str_contains($adapter, "['company_id', 'tenant_company_id']")) $fail('Package loader still accepts tenant_company_id as authoritative metadata.');
if (! str_contains($adapter, "return 'company_id'")) $fail('Runtime company scope key is not company_id.');

echo "MCP authoritative company boundary: PASS\n";
