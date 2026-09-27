<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$required = [
    'System/Contracts/Registry/InterfaceContributionRegistryContract.php',
    'System/Contracts/Discovery/InterfaceContributionDiscoveryContract.php',
    'System/Registry/InMemoryInterfaceContributionRegistry.php',
    'System/Discovery/ContributionHealth.php',
    'System/Discovery/NormalizedInterfaceContribution.php',
    'System/Discovery/InterfaceContributionValidationResult.php',
    'System/Discovery/InterfaceContributionDiscoverySnapshot.php',
    'System/Discovery/InterfaceContributionValidator.php',
    'System/Discovery/InterfaceContributionDiscovery.php',
];
foreach ($required as $file) require_once $root . '/' . $file;

use App\Extensions\TitanInterfaceRuntime\System\Discovery\InterfaceContributionDiscovery;
use App\Extensions\TitanInterfaceRuntime\System\Discovery\InterfaceContributionValidator;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryInterfaceContributionRegistry;

$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) $failures[] = $message;
};

$self = json_decode((string) file_get_contents($root . '/resources/interface/interface-manifest.json'), true, 512, JSON_THROW_ON_ERROR);
$selfResult = (new InterfaceContributionValidator())->validate($self, 'titan-interface-runtime');
$check($selfResult->valid(), 'self interface manifest invalid: ' . implode('; ', $selfResult->errors));

$tmp = sys_get_temp_dir() . '/tir-pass2-' . bin2hex(random_bytes(6));
mkdir($tmp, 0777, true);
$make = static function (string $folder, string $key, bool $enabled, bool $write = true, ?callable $mutate = null) use ($tmp): void {
    $dir = $tmp . '/' . $folder;
    mkdir($dir . '/resources/interface', 0777, true);
    file_put_contents($dir . '/extension.manifest.json', json_encode([
        'key' => $key,
        'interface_contribution' => [
            'enabled' => $enabled,
            'contract_version' => '1.0',
            'manifest' => 'resources/interface/interface-manifest.json',
        ],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    if (! $write) return;
    $manifest = [
        'schema_version' => '1.0', 'extension_key' => $key,
        'context' => ['required' => ['company_id','user_id','product_surface','domain'], 'optional' => []],
        'domains' => [[
            'key' => 'platform', 'label' => 'Platform', 'layer' => 'platform',
            'product_surfaces' => ['command'], 'intent_surfaces' => ['home'],
            'object_refs' => [], 'default_view_refs' => [],
        ]],
        'objects' => [], 'facets' => [], 'views' => [], 'actions' => [], 'lifecycles' => [], 'global_work' => [],
        'providers' => ['attention' => [], 'decisions' => [], 'insights' => []], 'legacy_data_surfaces' => [],
    ];
    if ($mutate !== null) $manifest = $mutate($manifest);
    file_put_contents($dir . '/resources/interface/interface-manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
};

$make('Valid', 'valid-one', true);
$make('Invalid', 'invalid-one', true, true, static function (array $m): array { $m['domains'][0]['object_refs'] = ['missing.object']; return $m; });
$make('Missing', 'missing-one', true, false);
$make('Disabled', 'disabled-one', false);
$make('DuplicateA', 'duplicate-one', true);
$make('DuplicateB', 'duplicate-one', true);
$make('Traversal', 'traversal-one', true);
$traversal = json_decode((string) file_get_contents($tmp . '/Traversal/extension.manifest.json'), true, 512, JSON_THROW_ON_ERROR);
$traversal['interface_contribution']['manifest'] = '../outside.json';
file_put_contents($tmp . '/Traversal/extension.manifest.json', json_encode($traversal, JSON_PRETTY_PRINT));

$registry = new InMemoryInterfaceContributionRegistry();
$discovery = new InterfaceContributionDiscovery($registry, new InterfaceContributionValidator(), $tmp);
$snapshot = $discovery->discover();
$check($registry->has('valid-one'), 'valid contribution not registered');
foreach (['invalid-one','missing-one','duplicate-one','traversal-one'] as $key) $check(! $registry->has($key), "unsafe contribution '{$key}' was registered");
$check(($snapshot->health['Valid']->status ?? null) === 'VALID', 'valid contributor health wrong');
$check(($snapshot->health['Invalid']->status ?? null) === 'DEGRADED', 'invalid contributor must degrade');
$check(($snapshot->health['Missing']->status ?? null) === 'DEGRADED', 'missing contribution must degrade');
$check(($snapshot->health['Disabled']->status ?? null) === 'DISABLED', 'disabled contribution status wrong');
$check(($snapshot->health['DuplicateA']->status ?? null) === 'DEGRADED' && ($snapshot->health['DuplicateB']->status ?? null) === 'DEGRADED', 'duplicates must both degrade');
$check(($snapshot->health['Traversal']->status ?? null) === 'DEGRADED', 'traversal manifest path must degrade');
$check(($snapshot->summary()['registered'] ?? null) === 1, 'registered count must be 1');
$check($discovery->discover() === $snapshot, 'non-forced discovery must return cached immutable snapshot');

$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($tmp, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
foreach ($it as $item) $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
rmdir($tmp);

if ($failures !== []) {
    foreach ($failures as $failure) fwrite(STDERR, "FAIL: {$failure}\n");
    exit(1);
}

echo "PASS: interface contribution schema semantics\n";
echo "PASS: valid contributor registration\n";
echo "PASS: invalid contributor isolated degradation\n";
echo "PASS: missing manifest isolated degradation\n";
echo "PASS: disabled contributor ignored with observable health\n";
echo "PASS: duplicate extension keys fail closed\n";
echo "PASS: traversal path rejected\n";
echo "PASS: discovery snapshot cache is stable\n";
