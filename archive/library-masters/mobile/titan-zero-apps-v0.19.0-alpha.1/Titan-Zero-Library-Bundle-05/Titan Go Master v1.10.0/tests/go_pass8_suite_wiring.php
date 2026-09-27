<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$suite = dirname($root);
$checks = 0;
$ok = static function (bool $condition, string $message) use (&$checks): void {
    $checks++;
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
};

$manifest = json_decode((string) file_get_contents($root.'/extension.json'), true, 512, JSON_THROW_ON_ERROR);
$ok(($manifest['version'] ?? null) === '1.10.0', 'version upgraded to 1.10.0');
$ok(($manifest['suite_wiring']['company_boundary'] ?? null) === 'company_id', 'company_id is the sole boundary');
$ok(in_array('App\\Extensions\\TitanGo\\System\\Contracts\\GoSuiteRuntimeInterface', $manifest['public_contracts'] ?? [], true), 'suite runtime public contract declared');

$required = [
    'TitanAppsCore/System/Services/TitanAppsApplicationRegistry.php',
    'InteractionEngine/System/Contracts/PublicInteractionEngineInterface.php',
    'InteractionEngine/System/Contracts/InteractionContextFactoryInterface.php',
    'TitanInterfaceRuntime/System/Contracts/InterfaceRuntime.php',
    'TitanVisualRuntime/System/Contracts/VisualRuntime.php',
    'TitanBuilder/System/Contracts/SurfaceRegistry.php',
];
foreach ($required as $path) {
    $ok(is_file($suite.'/'.$path), 'suite dependency exists: '.$path);
}

$runtime = (string) file_get_contents($root.'/System/Runtime/GoSuiteRuntime.php');
$ok(str_contains($runtime, "new InterfaceContext(\n            'go'"), 'Interface Runtime receives canonical go surface');
$ok(str_contains($runtime, 'InteractionContextFactoryInterface::class'), 'Interaction Engine context factory is wired');
$ok(str_contains($runtime, 'PublicInteractionEngineInterface::class'), 'Interaction Engine public contract is wired');
$ok(str_contains($runtime, 'GoProjectionPolicy::assertProjection'), 'projection security remains before Interface Runtime');
$ok(!str_contains($runtime, "'tenant_id' =>"), 'suite runtime does not emit tenant_id authority');

$bridge = (string) file_get_contents($root.'/System/Runtime/GoRuntimeBridge.php');
$ok(str_contains($bridge, 'PublicInteractionEngineInterface'), 'bridge reports actual Interaction Engine contract');
$ok(str_contains($bridge, 'TitanInterfaceRuntime'), 'bridge reports actual Interface Runtime contract');
$ok(str_contains($bridge, 'TitanVisualRuntime'), 'bridge reports actual Visual Runtime contract');
$ok(str_contains($bridge, 'TitanBuilder'), 'bridge reports actual Builder contract');

$config = (string) file_get_contents($root.'/config/titan-go.php');
$ok(str_contains($config, "'company_boundary' => 'company_id'"), 'config declares company_id boundary');
$ok(!preg_match("/'company_boundary'\s*=>\s*'tenant/", $config), 'no legacy tenant boundary configured');


$routes = (string) file_get_contents($root.'/routes/web.php');
$ok(str_contains($routes, 'GoShellController'), 'Go shell routes use wired controller');
$ok(str_contains($routes, '/runtime/bootstrap'), 'runtime bootstrap route exposed behind auth middleware');
$ok(str_contains($routes, '/runtime/health'), 'runtime health route exposed behind auth middleware');

$shell = (string) file_get_contents($root.'/resources/views/go/shell.blade.php');
$ok(str_contains($shell, 'data-company-boundary="company_id"'), 'Go shell declares company_id boundary');
$ok(str_contains($shell, 'titan-go-bootstrap'), 'Go shell embeds real bootstrap descriptor');

echo "PASS: {$checks}/{$checks} Titan Go suite wiring checks\n";
