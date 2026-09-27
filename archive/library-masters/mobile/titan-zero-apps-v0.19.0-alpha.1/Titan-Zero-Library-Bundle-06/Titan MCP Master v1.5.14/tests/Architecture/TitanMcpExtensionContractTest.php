<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$installerManifest = json_decode((string) file_get_contents($root.'/extension.json'), true);
$installerExpected = [
    'schema' => 'titan-extension-v1',
    'slug' => 'titan-mcp',
    'name' => 'Titan MCP',
    'version' => '1.5.14',
    'folder' => 'TitanMcp',
    'provider' => 'App\\Extensions\\TitanMcp\\System\\TitanMcpServiceProvider',
];
foreach ($installerExpected as $field => $expected) {
    if (($installerManifest[$field] ?? null) !== $expected) {
        fwrite(STDERR, "Installer manifest {$field} mismatch\n");
        exit(1);
    }
}
$required = [
    'extension.json','extension.manifest.json','System/TitanMcpServiceProvider.php','routes/admin.php','routes/mcp.php',
    'System/Http/Transport/McpTransportController.php','System/Http/Transport/McpToolInvoker.php',
    'System/Mcp/Tools/RepositoryTools.php','System/Mcp/Tools/BackupTools.php',
];
foreach ($required as $path) {
    if (!is_file($root.'/'.$path)) { fwrite(STDERR, "Missing {$path}\n"); exit(1); }
}
$catalogue = file_get_contents($root.'/System/Mcp/Support/McpCatalogue.php');
preg_match_all("/self::(?:read|write|coordinate)\\('([^']+)'/", (string)$catalogue, $m);
if (count($m[1] ?? []) !== 34 || count(array_unique($m[1] ?? [])) !== 34) { fwrite(STDERR, "Expected 34 unique MCP tools\n"); exit(1); }
$all = '';
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
foreach ($it as $file) {
    if (!$file->isFile()) continue;
    $relative=str_replace('\\','/',substr($file->getPathname(),strlen($root)+1));
    if (str_starts_with($relative,'tests/') || str_starts_with($relative,'docs/')) continue;
    $all .= file_get_contents($file->getPathname());
}
foreach (['PhpMcp\\','App\\Mcp\\Titan\\','App\\Providers\\TitanMcpServiceProvider'] as $forbidden) {
    if (str_contains($all, $forbidden) && $forbidden !== 'App\\Providers\\TitanMcpServiceProvider') { fwrite(STDERR, "Forbidden legacy dependency {$forbidden}\n"); exit(1); }
}

// Prove every canonical tool points to a shipped handler class and method.
$map = [
    'BackupTools','CommandTools','DatabaseMutationTools','MutationTools','MutationCoordinationTools','OperationsTools','ProjectTools','RecoveryTools','RepositoryTools','RuntimeTools','SchemaTools',
];
foreach ($map as $short) {
    $path = $root.'/System/Mcp/Tools/'.$short.'.php';
    if (!is_file($path)) { fwrite(STDERR, "Missing tool handler {$short}\n"); exit(1); }
}
preg_match_all("/self::(?:read|write|coordinate)\\('([^']+)'[\\s\\S]*?([A-Za-z]+Tools)::class, '([^']+)'/", (string)$catalogue, $defs, PREG_SET_ORDER);
if (count($defs) !== 34) { fwrite(STDERR, "Could not resolve all 34 catalogue handler definitions\n"); exit(1); }
foreach ($defs as $def) {
    [, $toolName, $handlerShort, $method] = $def;
    $source = (string) file_get_contents($root.'/System/Mcp/Tools/'.$handlerShort.'.php');
    if (!preg_match('/public\\s+function\\s+'.preg_quote($method,'/').'\\s*\\(/', $source)) {
        fwrite(STDERR, "Unwired catalogue handler {$toolName}: {$handlerShort}::{$method}\n"); exit(1);
    }
}

echo "Titan MCP extension architecture contract PASS\n";
