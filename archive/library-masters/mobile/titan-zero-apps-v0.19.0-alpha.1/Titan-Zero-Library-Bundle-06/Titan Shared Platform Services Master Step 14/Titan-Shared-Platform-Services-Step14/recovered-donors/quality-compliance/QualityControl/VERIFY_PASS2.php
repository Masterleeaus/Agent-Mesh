<?php

declare(strict_types=1);

$qcRoot = __DIR__;
$packageRoot = dirname(__DIR__);
$failures = [];

function p2verify(bool $condition, string $label): void
{
    global $failures;
    if ($condition) {
        echo "PASS: {$label}\n";
        return;
    }
    $failures[] = $label;
    echo "FAIL: {$label}\n";
}

function p2files(string $root, string $suffix): array
{
    $files = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $file) {
        if ($file->isFile() && str_ends_with($file->getFilename(), $suffix)) {
            $files[] = $file->getPathname();
        }
    }
    sort($files);
    return $files;
}

function p2relative(string $file, string $root): string
{
    return str_replace('\\', '/', substr($file, strlen(rtrim($root, DIRECTORY_SEPARATOR)) + 1));
}

function p2lint(string $file): bool
{
    exec(escapeshellarg(PHP_BINARY) . ' -l ' . escapeshellarg($file) . ' 2>&1', $out, $code);
    return $code === 0;
}

// Pass 1 kernel behavior must remain green.
passthru(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($packageRoot . '/TitanZeroAssurance/Tests/run.php'), $kernelCode);
p2verify($kernelCode === 0, 'Pass 1 TitanZeroAssurance behavioral suite remains green');

// Pass 2 convergence behavior/structure.
passthru(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($qcRoot . '/Tests/Pass2CanonicalQualityTest.php'), $pass2Code);
p2verify($pass2Code === 0, 'Pass 2 canonical quality convergence suite');

// Focus lint: everything in canonical runtime + touched Complaint integration.
$focusFiles = array_merge(p2files($qcRoot, '.php'), p2files($packageRoot . '/TitanZeroAssurance', '.php'));
$focusFiles[] = $packageRoot . '/feedback/CustomerFeedback/Listeners/QualityControlNeedsRecleanListener.php';
$focusFailures = [];
foreach (array_unique($focusFiles) as $file) {
    if (!p2lint($file)) {
        $focusFailures[] = p2relative($file, $packageRoot);
    }
}
p2verify($focusFailures === [], 'all Pass 2 canonical/touched PHP lints cleanly');
foreach ($focusFailures as $failure) {
    echo "  {$failure}\n";
}

// Whole package lint: after quarantining Inspection, only the exact remaining legacy debt is allowed.
$baselinePath = $packageRoot . '/TitanZeroAssurance/PASS5_LEGACY_PHP_LINT_BASELINE.txt';
$expected = array_values(array_filter(array_map('trim', file($baselinePath) ?: [])));
$expected = array_values(array_filter($expected, static fn (string $file): bool => is_file($packageRoot . '/' . $file)));
sort($expected);
$actual = [];
$phpFiles = p2files($packageRoot, '.php');
foreach ($phpFiles as $file) {
    if (!p2lint($file)) {
        $actual[] = p2relative($file, $packageRoot);
    }
}
sort($actual);
p2verify($actual === $expected, 'whole-package lint matches current cumulative legacy baseline exactly');
if ($actual !== $expected) {
    foreach (array_diff($actual, $expected) as $file) {
        echo "  NEW FAILURE: {$file}\n";
    }
    foreach (array_diff($expected, $actual) as $file) {
        echo "  BASELINE CHANGED: {$file}\n";
    }
}

// JSON validity.
$jsonFailures = [];
$jsonFiles = p2files($packageRoot, '.json');
foreach ($jsonFiles as $file) {
    try {
        json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    } catch (Throwable $e) {
        $jsonFailures[] = p2relative($file, $packageRoot) . ': ' . $e->getMessage();
    }
}
p2verify($jsonFailures === [], 'all JSON files parse');
foreach ($jsonFailures as $failure) {
    echo "  {$failure}\n";
}

// Runtime ownership checks.
$qualityModule = json_decode((string) file_get_contents($qcRoot . '/module.json'), true, 512, JSON_THROW_ON_ERROR);
$cleanModule = json_decode((string) file_get_contents($packageRoot . '/CleanQuality/module.json'), true, 512, JSON_THROW_ON_ERROR);
$inspectionModule = json_decode((string) file_get_contents($packageRoot . '/Inspection/module.json'), true, 512, JSON_THROW_ON_ERROR);
p2verify(($qualityModule['active'] ?? 0) === 1, 'QualityControl is active');
p2verify(($cleanModule['active'] ?? 1) === 0 && ($cleanModule['providers'] ?? ['x']) === [], 'CleanQuality runtime disabled');
p2verify(($inspectionModule['active'] ?? 1) === 0 && ($inspectionModule['providers'] ?? ['x']) === [], 'Inspection runtime disabled');
p2verify(p2files($packageRoot . '/CleanQuality', '.php') === [], 'CleanQuality top-level descriptor contains no executable PHP');
p2verify(p2files($packageRoot . '/Inspection', '.php') === [], 'Inspection top-level descriptor contains no executable PHP');

// Donor archives preserved and valid.
$donorArchives = [
    $packageRoot . '/LegacyDonors/CleanQuality-Pass1-Source.zip',
    $packageRoot . '/LegacyDonors/Inspection-Pass1-Source.zip',
];
foreach ($donorArchives as $archive) {
    $cmd = 'unzip -tqq ' . escapeshellarg($archive) . ' 2>&1';
    exec($cmd, $out, $code);
    p2verify(is_file($archive) && $code === 0, basename($archive) . ' preserved and integrity-valid');
}

// No PHP runtime references to quarantined namespaces remain anywhere in the unpacked package.
$donorRefs = [];
foreach ($phpFiles as $file) {
    $text = (string) file_get_contents($file);
    if (str_contains($text, 'Modules\\CleanQuality\\') || str_contains($text, 'Modules\\Inspection\\')) {
        $donorRefs[] = p2relative($file, $packageRoot);
    }
}
p2verify($donorRefs === [], 'no executable PHP references quarantined CleanQuality/Inspection namespaces');
foreach ($donorRefs as $ref) {
    echo "  {$ref}\n";
}

// Canonical capability manifest still normalizes through TitanZeroAssurance.
spl_autoload_register(static function (string $class) use ($packageRoot): void {
    $prefix = 'Modules\\TitanZeroAssurance\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = substr($class, strlen($prefix));
    $path = $packageRoot . '/TitanZeroAssurance/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($path)) {
        require_once $path;
    }
});
$capabilityCount = 0;
try {
    $config = require $qcRoot . '/Config/titanzero.php';
    $registry = new Modules\TitanZeroAssurance\Services\CapabilityRegistry();
    $registry->registerModuleFromArray('QualityControl', (array) ($config['capabilities'] ?? []));
    $capabilityCount = count($registry->all());
    p2verify($capabilityCount >= 17, 'QualityControl capability registry includes converged action/report capabilities');
} catch (Throwable $e) {
    p2verify(false, 'QualityControl capability registry includes converged action/report capabilities');
    echo '  ' . $e->getMessage() . "\n";
}

// Sole new tenant boundary remains company_id.
$pass2Runtime = '';
foreach (p2files($qcRoot, '.php') as $file) {
    $relativeFocus = p2relative($file, $qcRoot);
    if (str_starts_with($relativeFocus, 'Tests/') || str_starts_with($relativeFocus, 'VERIFY_')) {
        continue;
    }
    $pass2Runtime .= (string) file_get_contents($file);
}
$pass2Runtime .= (string) file_get_contents($packageRoot . '/feedback/CustomerFeedback/Listeners/QualityControlNeedsRecleanListener.php');
p2verify(!str_contains($pass2Runtime, 'tenant_company_id'), 'Pass 2 runtime introduces no tenant_company_id');
p2verify(!preg_match('/company[_ ]?id\s*\?\?\s*\$?user/i', $pass2Runtime), 'Pass 2 runtime introduces no user-id-as-company fallback');

// No duplicate canonical table creation outside QualityControl runtime.
$ownerViolations = [];
foreach ($phpFiles as $file) {
    if (str_starts_with(p2relative($file, $packageRoot), 'QualityControl/')) {
        continue;
    }
    $text = (string) file_get_contents($file);
    if (preg_match("/Schema::create\\(['\"](?:inspection_|qc_records|qc_record_items|qc_corrective|qc_followup)/", $text)) {
        $ownerViolations[] = p2relative($file, $packageRoot);
    }
}
p2verify($ownerViolations === [], 'no executable module outside QualityControl creates canonical quality tables');
foreach ($ownerViolations as $file) {
    echo "  {$file}\n";
}

echo "\nSUMMARY\n";
echo 'PHP files: ' . count($phpFiles) . "\n";
echo 'Legacy PHP failures: ' . count($actual) . "\n";
echo 'JSON files: ' . count($jsonFiles) . "\n";
echo 'QualityControl capabilities: ' . $capabilityCount . "\n";
echo 'Quarantined donor archives: ' . count($donorArchives) . "\n";

if ($failures !== []) {
    echo 'PASS2_VERIFY: FAIL (' . count($failures) . " checks failed)\n";
    exit(1);
}

echo "PASS2_VERIFY: PASS\n";
