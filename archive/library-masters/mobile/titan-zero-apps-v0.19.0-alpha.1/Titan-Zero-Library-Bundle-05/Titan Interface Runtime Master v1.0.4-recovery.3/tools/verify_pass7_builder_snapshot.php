<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\TitanInterfaceRuntime\\';
    if (!str_starts_with($class, $prefix)) return;
    $path = $root . '/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($path)) require_once $path;
});

use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveHints;

$directory = getenv('TITAN_BUILDER_COMPONENTS_DIR') ?: '';
if (!is_dir($directory)) {
    fwrite(STDERR, "TITAN_BUILDER_COMPONENTS_DIR is required\n");
    exit(2);
}
$components = [];
foreach (glob(rtrim($directory, '/'). '/*.json') ?: [] as $path) {
    $decoded = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($decoded) || !is_string($decoded['id'] ?? null)) throw new RuntimeException("Invalid Builder component: {$path}");
    $components[$decoded['id']] = $decoded;
}
if (count($components) < 100) throw new RuntimeException('Builder component snapshot is unexpectedly small.');
$policy = new PresentationComponentPolicy();
foreach ($components as $id => $definition) {
    if (!$policy->accepts($definition, ResponsiveHints::required())) throw new RuntimeException("Builder component '{$id}' failed presentation policy.");
}
$adapter = new BuilderPresentationAdapter(new ArrayComponentVocabulary($components, 'titan-builder-snapshot'), $policy);
$expected = [
    ['entity-card','card','entity-card'], ['table','table','table'], ['kanban-board','board','kanban-board'],
    ['timeline','timeline','timeline'], ['drawer','drawer','drawer'], ['form-wizard','wizard','form-wizard'],
    ['approval-card','card','approval-card'], ['report-shell','report','report-shell'], ['chat-thread','chat','chat-thread'],
];
foreach ($expected as [$hint,$container,$want]) {
    $got = $adapter->resolve($hint,$container,ResponsiveHints::required());
    if ($got->componentId !== $want || $got->fallback) throw new RuntimeException("Builder mapping failed for {$hint}.");
}
echo 'PASS7_BUILDER_SNAPSHOT_OK components=' . count($components) . "\n";
