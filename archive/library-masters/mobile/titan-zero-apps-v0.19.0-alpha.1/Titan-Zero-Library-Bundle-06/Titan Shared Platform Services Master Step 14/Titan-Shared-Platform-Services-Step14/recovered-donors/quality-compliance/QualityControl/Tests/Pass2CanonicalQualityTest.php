<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$qc = $root . '/QualityControl';
$failures = [];

function p2check(bool $condition, string $label): void
{
    global $failures;
    if ($condition) {
        echo "PASS: {$label}\n";
        return;
    }
    $failures[] = $label;
    echo "FAIL: {$label}\n";
}

function p2json(string $path): array
{
    return json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
}

$qcModule = p2json($qc . '/module.json');
$cleanModule = p2json($root . '/CleanQuality/module.json');
$inspectionModule = p2json($root . '/Inspection/module.json');

p2check(($qcModule['active'] ?? 0) === 1, 'QualityControl remains the active canonical runtime');
p2check(in_array('Modules\\QualityControl\\Providers\\FilamentServiceProvider', $qcModule['providers'] ?? [], true), 'QualityControl owns the merged Filament surface');
p2check(($cleanModule['active'] ?? 1) === 0 && ($cleanModule['providers'] ?? ['x']) === [], 'CleanQuality is runtime-disabled and owns no providers');
p2check(($inspectionModule['active'] ?? 1) === 0 && ($inspectionModule['providers'] ?? ['x']) === [], 'Inspection is runtime-disabled and owns no providers');
p2check(($cleanModule['replaced_by'] ?? null) === 'QualityControl', 'CleanQuality explicitly declares QualityControl replacement');
p2check(($inspectionModule['replaced_by'] ?? null) === 'QualityControl', 'Inspection explicitly declares QualityControl replacement');
$cleanQualityPhp = iterator_count(new RegexIterator(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/CleanQuality', FilesystemIterator::SKIP_DOTS)), '/\\.php$/i'));
p2check($cleanQualityPhp === 0, 'CleanQuality donor PHP is quarantined outside runtime module discovery');
$inspectionPhp = iterator_count(new RegexIterator(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/Inspection', FilesystemIterator::SKIP_DOTS)), '/\\.php$/i'));
p2check($inspectionPhp === 0, 'broken Inspection donor PHP is quarantined outside runtime module discovery');

$lifecycle = require $qc . '/manifests/lifecycle.php';
$planningOwners = array_map(static fn (array $phase): mixed => $phase['owner'] ?? null, array_intersect_key(
    $lifecycle['phases'] ?? [],
    array_flip(['schedule_created', 'schedule_rescheduled', 'template_applied'])
));
p2check($planningOwners !== [] && count(array_unique($planningOwners)) === 1 && reset($planningOwners) === 'quality_control', 'QualityControl owns planning as well as verification');
p2check(($lifecycle['compatibility']['legacy_modules'] ?? null) === ['CleanQuality', 'Inspection'], 'lifecycle records explicit legacy compatibility modules');

$ai = require $qc . '/manifests/ai.php';
$governed = $ai['governed_operations'] ?? [];
foreach (['complete_inspection', 'authorise_reclean', 'score_quality_check', 'generate_quality_report'] as $operation) {
    p2check(isset($governed[$operation]), "merged AI operation {$operation} is canonical in QualityControl");
}

$titan = require $qc . '/Config/titanzero.php';
$keys = array_column($titan['capabilities'] ?? [], 'key');
foreach ([
    'quality_control.inspection.complete',
    'quality_control.reclean.authorise',
    'quality_control.quality_check.score',
    'quality_control.report.generate',
] as $key) {
    p2check(in_array($key, $keys, true), "canonical capability {$key} is registered");
}

p2check(is_file($qc . '/Actions/CompleteInspection.php'), 'CleanQuality complete-inspection concept merged as canonical action');
p2check(is_file($qc . '/Actions/AuthoriseReclean.php'), 'CleanQuality reclean-authorisation concept merged as canonical action');
p2check(is_file($qc . '/Actions/ScoreQualityCheck.php'), 'CleanQuality scoring concept merged as canonical action');
p2check(is_file($qc . '/Services/QualityReportService.php'), 'quality report generation concept merged as canonical service');
p2check(is_file($qc . '/Filament/Resources/InspectionScheduleResource.php'), 'Filament inspection surface targets canonical inspection schedules');
p2check(is_file($qc . '/Filament/Resources/QualityCheckResource.php'), 'Filament QC surface targets canonical qc_records');
p2check(is_file($qc . '/Filament/Widgets/QualityScoreboard.php'), 'merged quality scoreboard exists in canonical module');

$routes = (string) file_get_contents($qc . '/Routes/web.php');
p2check(str_contains($routes, "prefix' => 'clean-quality'"), 'legacy CleanQuality URLs are preserved only by explicit QualityControl bridge routes');
p2check(str_contains($routes, "clean-quality.compat.dashboard"), 'legacy CleanQuality dashboard has named compatibility bridge');

$runtimeText = '';
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($qc, FilesystemIterator::SKIP_DOTS));
foreach ($iterator as $file) {
    if (!$file->isFile() || $file->getExtension() !== 'php' || str_contains($file->getPathname(), '/Tests/')) {
        continue;
    }
    $runtimeText .= (string) file_get_contents($file->getPathname());
}
p2check(!str_contains($runtimeText, 'Modules\\CleanQuality\\'), 'canonical QualityControl runtime has no CleanQuality class dependency');
p2check(!str_contains($runtimeText, 'Modules\\Inspection\\'), 'canonical QualityControl runtime has no Inspection class dependency');
$complaintBridge = (string) file_get_contents($root . '/feedback/CustomerFeedback/Listeners/QualityControlNeedsRecleanListener.php');
p2check(!str_contains($complaintBridge, 'Modules\\CleanQuality\\'), 'canonical feedback quality bridge has no quarantined CleanQuality dependency');
p2check(str_contains($complaintBridge, "where('company_id', \$companyId)"), 'canonical feedback bridge resolves inspection schedule inside explicit company boundary');
p2check(!str_contains($runtimeText, "protected \$table = 'inspections'"), 'canonical QualityControl runtime does not reintroduce donor inspections table ownership');

if ($failures !== []) {
    echo "\nPASS2_CANONICAL_QUALITY_TEST: FAIL (" . count($failures) . " failures)\n";
    exit(1);
}

echo "\nPASS2_CANONICAL_QUALITY_TEST: PASS\n";
