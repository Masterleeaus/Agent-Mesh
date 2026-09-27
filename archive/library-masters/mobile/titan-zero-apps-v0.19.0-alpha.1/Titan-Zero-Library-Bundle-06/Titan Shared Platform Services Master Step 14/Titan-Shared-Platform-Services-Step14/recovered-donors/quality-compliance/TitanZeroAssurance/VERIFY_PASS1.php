<?php

declare(strict_types=1);

$moduleRoot = __DIR__;
$packageRoot = dirname(__DIR__);
$failures = [];

function check(bool $condition, string $label): void
{
    global $failures;
    if ($condition) {
        echo "PASS: {$label}\n";
        return;
    }
    $failures[] = $label;
    echo "FAIL: {$label}\n";
}

function filesRecursive(string $root, string $suffix): array
{
    $files = [];
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        if ($file->isFile() && str_ends_with($file->getFilename(), $suffix)) {
            $files[] = $file->getPathname();
        }
    }
    sort($files);
    return $files;
}

function lintPhp(string $file): bool
{
    $command = escapeshellarg(PHP_BINARY) . ' -l ' . escapeshellarg($file) . ' 2>&1';
    exec($command, $output, $code);
    return $code === 0;
}

function relativePath(string $file, string $root): string
{
    $prefix = rtrim($root, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    return str_replace('\\', '/', substr($file, strlen($prefix)));
}

// Behavioral kernel suite.
$testCommand = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($moduleRoot . '/Tests/run.php');
passthru($testCommand, $testCode);
check($testCode === 0, 'TitanZeroAssurance behavioral suite');

// New and modified PHP must lint cleanly.
$focusFiles = filesRecursive($moduleRoot, '.php');
$focusFiles[] = $packageRoot . '/QualityControl/Traits/CompanyScoped.php';
$focusFiles[] = $packageRoot . '/QualityControl/Providers/QualityControlServiceProvider.php';
$focusLintFailures = array_values(array_filter($focusFiles, static fn (string $file): bool => !lintPhp($file)));
check($focusLintFailures === [], 'all Pass 1 new/modified PHP files lint cleanly');
if ($focusLintFailures !== []) {
    foreach ($focusLintFailures as $file) {
        echo '  ' . relativePath($file, $packageRoot) . "\n";
    }
}

// Whole-package lint may contain only the exact pre-existing donor baseline.
$baselinePath = $packageRoot . '/TitanZeroAssurance/PASS5_LEGACY_PHP_LINT_BASELINE.txt';
$expected = array_values(array_filter(array_map('trim', file($baselinePath) ?: [])));
sort($expected);
$actual = [];
$phpFiles = filesRecursive($packageRoot, '.php');
foreach ($phpFiles as $file) {
    if (!lintPhp($file)) {
        $actual[] = relativePath($file, $packageRoot);
    }
}
sort($actual);
check($actual === $expected, 'whole-package PHP lint matches current cumulative legacy baseline');
if ($actual !== $expected) {
    $new = array_values(array_diff($actual, $expected));
    $missing = array_values(array_diff($expected, $actual));
    foreach ($new as $file) {
        echo "  NEW FAILURE: {$file}\n";
    }
    foreach ($missing as $file) {
        echo "  BASELINE CHANGED: {$file}\n";
    }
}

// All JSON must parse.
$jsonFiles = filesRecursive($packageRoot, '.json');
$jsonFailures = [];
foreach ($jsonFiles as $file) {
    try {
        json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    } catch (Throwable $e) {
        $jsonFailures[] = relativePath($file, $packageRoot) . ': ' . $e->getMessage();
    }
}
check($jsonFailures === [], 'all JSON files parse');
foreach ($jsonFailures as $failure) {
    echo "  {$failure}\n";
}

// company_id is the sole new tenant boundary.
$kernelText = '';
foreach (filesRecursive($moduleRoot, '.php') as $file) {
    $relative = relativePath($file, $moduleRoot);
    if (str_starts_with($relative, 'Tests/') || str_starts_with(basename($relative), 'VERIFY_PASS')) {
        continue;
    }
    $kernelText .= (string) file_get_contents($file);
}
$kernelText .= (string) file_get_contents($packageRoot . '/QualityControl/Traits/CompanyScoped.php');
check(!str_contains($kernelText, 'tenant_company_id'), 'Pass 1 runtime code contains no tenant_company_id boundary');
check(!preg_match('/company[_ ]?id\s*\?\?\s*\$?user/i', $kernelText), 'Pass 1 runtime code contains no user-id-as-company fallback');

// QualityControl capability manifest must normalize through the new registry.
spl_autoload_register(static function (string $class) use ($moduleRoot): void {
    $prefix = 'Modules\\TitanZeroAssurance\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = substr($class, strlen($prefix));
    $path = $moduleRoot . '/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($path)) {
        require_once $path;
    }
});
try {
    $config = require $packageRoot . '/QualityControl/Config/titanzero.php';
    $registry = new Modules\TitanZeroAssurance\Services\CapabilityRegistry();
    $registry->registerModuleFromArray('QualityControl', (array) ($config['capabilities'] ?? []));
    $capabilityCount = count($registry->all());
    check($capabilityCount > 0, 'QualityControl capabilities normalize through canonical registry');
} catch (Throwable $e) {
    check(false, 'QualityControl capabilities normalize through canonical registry');
    echo '  ' . $e->getMessage() . "\n";
    $capabilityCount = 0;
}

echo "\nSUMMARY\n";
echo 'PHP files: ' . count($phpFiles) . "\n";
echo 'Legacy PHP failures: ' . count($actual) . "\n";
echo 'JSON files: ' . count($jsonFiles) . "\n";
echo 'Normalized QualityControl capabilities: ' . $capabilityCount . "\n";

if ($failures !== []) {
    echo 'PASS1_VERIFY: FAIL (' . count($failures) . " checks failed)\n";
    exit(1);
}

echo "PASS1_VERIFY: PASS\n";
