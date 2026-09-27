<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$manifestPath = $root.'/extension.json';
$manifest = json_decode((string) file_get_contents($manifestPath), true, flags: JSON_THROW_ON_ERROR);

$integrity = [];
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)
);

foreach ($iterator as $file) {
    if (! $file->isFile() || $file->isLink()) {
        continue;
    }

    $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));
    if (in_array($relative, ['extension.json', 'PACKAGE-FILES.sha256'], true)) {
        continue;
    }
    if (str_starts_with($relative, '__MACOSX/') || str_starts_with($relative, '.git/') || str_starts_with($relative, 'node_modules/')) {
        continue;
    }

    $integrity[$relative] = 'sha256:'.hash_file('sha256', $file->getPathname());
}

ksort($integrity, SORT_STRING);
$manifest['integrity'] = $integrity;
file_put_contents(
    $manifestPath,
    json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n"
);

echo 'Updated extension.json integrity map: '.count($integrity)." files\n";
