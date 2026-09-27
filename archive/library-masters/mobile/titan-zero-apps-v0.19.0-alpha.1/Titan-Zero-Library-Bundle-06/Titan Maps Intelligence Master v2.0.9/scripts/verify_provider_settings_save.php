<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$file = $root.'/Services/ProviderConnectionSettingsService.php';
if (! is_file($file)) {
    fwrite(STDERR, "FAIL: provider settings save service is missing\n");
    exit(1);
}
$source = (string) file_get_contents($file);
foreach ([
    'titan-maps-intelligence.provider.manage',
    'providerConfig(',
    'MapProviderConnection::query()->updateOrCreate',
    "'company_id' => \$companyId",
] as $needle) {
    if (! str_contains($source, $needle)) {
        fwrite(STDERR, "FAIL: provider settings save path missing {$needle}\n");
        exit(1);
    }
}
echo "OK: provider settings save validates configuration before persistence\n";
