<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$views = $root . '/resources/views';
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($views));
$violations = [];

foreach ($iterator as $file) {
    if (!$file->isFile() || !str_ends_with($file->getFilename(), '.blade.php')) {
        continue;
    }

    $path = $file->getPathname();
    $contents = file_get_contents($path);
    if ($contents === false) {
        throw new RuntimeException("Unable to read {$path}");
    }

    if (preg_match_all('/@php\s*\(/', $contents, $matches, PREG_OFFSET_CAPTURE)) {
        foreach ($matches[0] as $match) {
            $line = substr_count(substr($contents, 0, $match[1]), "\n") + 1;
            $violations[] = str_replace($root . DIRECTORY_SEPARATOR, '', $path) . ':' . $line;
        }
    }
}

if ($violations !== []) {
    fwrite(STDERR, "FAIL: Inline @php(...) directives are not host-safe under the Livewire/Blade compiler used by Titan Zero:\n - " . implode("\n - ", $violations) . "\n");
    exit(1);
}

echo "PASS: all Blade views avoid inline @php(...) directives and use explicit Blade/PHP boundaries.\n";
