<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$views = glob($root.'/resources/views/admin/*.blade.php') ?: [];
if ($views === []) {
    fwrite(STDERR, "No Titan MCP admin Blade views found\n");
    exit(1);
}

$paired = [
    ['@if', '@endif'],
    ['@foreach', '@endforeach'],
    ['@forelse', '@endforelse'],
];

foreach ($views as $view) {
    $lines = file($view, FILE_IGNORE_NEW_LINES) ?: [];
    foreach ($lines as $index => $line) {
        foreach ($paired as [$open, $close]) {
            if (str_contains($line, $open) && str_contains($line, $close)) {
                fwrite(STDERR, basename($view).':'.($index + 1)." keeps {$open}/{$close} on one line; Livewire ExtendBlade can miscompile this pattern\n");
                exit(1);
            }
        }
    }
}

echo "Titan MCP Blade/Livewire compatibility PASS\n";
