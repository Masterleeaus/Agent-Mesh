<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = [];
$assert = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) {
        $failures[] = $message;
    }
};

$sidecar = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true, flags: JSON_THROW_ON_ERROR);
$assert(($sidecar['data']['tenant_key'] ?? null) === 'company_id', 'sidecar tenant_key must be company_id');

$required = [
    'System/Security/CompanyContext.php',
    'System/Models/Concerns/BelongsToCompany.php',
    'database/migrations/2026_08_09_000200_migrate_titan_builder_to_company_boundary.php',
];
foreach ($required as $relative) {
    $assert(is_file($root.'/'.$relative), 'missing '.$relative);
}

$scanRoots = ['System', 'routes', 'config', 'tests/Feature', 'tests/Architecture'];
foreach ($scanRoots as $scanRoot) {
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/'.$scanRoot, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        if (! $file->isFile()) {
            continue;
        }
        $path = $file->getPathname();
        if (str_ends_with($path, 'company_boundary_contract.php')) {
            continue;
        }
        $contents = (string) file_get_contents($path);
        $relative = substr($path, strlen($root) + 1);
        foreach (['tenant_id', 'TenantContext', 'BelongsToTenant', 'forTenant(', 'findPageForTenant', 'latestSpecForTenant'] as $forbidden) {
            $assert(! str_contains($contents, $forbidden), "$relative contains legacy boundary token $forbidden");
        }
    }
}

$context = is_file($root.'/System/Security/CompanyContext.php') ? (string) file_get_contents($root.'/System/Security/CompanyContext.php') : '';
$assert(str_contains($context, "attributes->get('company_id')"), 'CompanyContext must read trusted company_id request attribute');
$assert(str_contains($context, '$user->company_id'), 'CompanyContext must read authenticated user company_id');
$assert(! str_contains($context, 'tenant_id'), 'CompanyContext must not fall back to tenant_id');

$migration = is_file($root.'/database/migrations/2026_08_09_000100_create_titan_builder_tables.php') ? (string) file_get_contents($root.'/database/migrations/2026_08_09_000100_create_titan_builder_tables.php') : '';
$assert(substr_count($migration, "unsignedBigInteger('company_id')") === 9, 'fresh install migration must create company_id on all nine Builder tables');
$assert(! str_contains($migration, "string('tenant_id'"), 'fresh install migration must not create tenant_id');

$bridge = (string) file_get_contents($root.'/database/migrations/2026_08_09_000200_migrate_titan_builder_to_company_boundary.php');
$assert(str_contains($bridge, "hasColumn(\$table, 'tenant_id')"), 'upgrade migration must recognise legacy tenant_id only for data migration');
$assert(str_contains($bridge, "whereNull('company_id')"), 'upgrade migration must backfill only unmapped company_id rows');
$assert(str_contains($bridge, "! ctype_digit(\$legacy)"), 'upgrade migration must refuse non-numeric legacy tenant identifiers');
$assert(str_contains($bridge, "whereNull('company_id')->count()"), 'upgrade migration must detect unresolved company mappings');
$assert(str_contains($bridge, 'throw new \\RuntimeException'), 'upgrade migration must fail closed when company mapping is unresolved');
$assert(str_contains($bridge, "dropColumn('tenant_id')"), 'successful upgrade must remove the legacy tenant_id column');

if ($failures !== []) {
    fwrite(STDERR, implode(PHP_EOL, $failures).PHP_EOL);
    exit(1);
}

echo "Company boundary contract: PASS\n";
