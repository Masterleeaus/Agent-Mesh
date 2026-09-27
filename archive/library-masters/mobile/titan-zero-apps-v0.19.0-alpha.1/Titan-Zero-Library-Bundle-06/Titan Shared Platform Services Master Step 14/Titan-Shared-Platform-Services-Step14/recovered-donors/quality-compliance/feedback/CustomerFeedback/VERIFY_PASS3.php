<?php

declare(strict_types=1);

$cfRoot = __DIR__;
$feedbackRoot = dirname(__DIR__);
$packageRoot = dirname($feedbackRoot);
$failures = [];

function p3verify(bool $condition, string $label): void
{
    global $failures;
    if ($condition) {
        echo "PASS: {$label}\n";
        return;
    }
    $failures[] = $label;
    echo "FAIL: {$label}\n";
}

function p3files(string $root, string $suffix): array
{
    if (!is_dir($root)) {
        return [];
    }
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

function p3relative(string $file, string $root): string
{
    return str_replace('\\', '/', substr($file, strlen(rtrim($root, DIRECTORY_SEPARATOR)) + 1));
}

function p3lint(string $file): bool
{
    $out = [];
    exec(escapeshellarg(PHP_BINARY) . ' -l ' . escapeshellarg($file) . ' 2>&1', $out, $code);
    return $code === 0;
}

function p3runtimeFiles(string $root): array
{
    return array_values(array_filter(p3files($root, '.php'), static function (string $file): bool {
        $normal = str_replace('\\', '/', $file);
        return !str_contains($normal, '/Tests/') && !str_starts_with(basename($file), 'VERIFY_PASS');
    }));
}

// Preserve prior pass regressions.
passthru(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($packageRoot . '/TitanZeroAssurance/Tests/run.php'), $pass1Code);
p3verify($pass1Code === 0, 'Pass 1 TitanZeroAssurance behavioral suite remains green');

passthru(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($packageRoot . '/QualityControl/Tests/Pass2CanonicalQualityTest.php'), $pass2Code);
p3verify($pass2Code === 0, 'Pass 2 canonical quality convergence suite remains green');

passthru(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($cfRoot . '/Tests/Pass3FeedbackConvergenceTest.php'), $pass3Code);
p3verify($pass3Code === 0, 'Pass 3 feedback/complaint convergence suite');

// Focus lint: all canonical/touched runtime code must be clean.
$focusFiles = array_unique(array_merge(
    p3files($cfRoot, '.php'),
    p3files($packageRoot . '/QualityControl', '.php'),
    p3files($packageRoot . '/TitanZeroAssurance', '.php')
));
$focusFailures = [];
foreach ($focusFiles as $file) {
    if (!p3lint($file)) {
        $focusFailures[] = p3relative($file, $packageRoot);
    }
}
p3verify($focusFailures === [], 'all Pass 3 canonical/touched PHP lints cleanly');
foreach ($focusFailures as $failure) {
    echo "  {$failure}\n";
}

// Whole-package lint must match exact recorded legacy debt and may not grow.
$baselinePath = $packageRoot . '/TitanZeroAssurance/PASS5_LEGACY_PHP_LINT_BASELINE.txt';
$expected = array_values(array_filter(array_map('trim', file($baselinePath) ?: [])));
sort($expected);
$actual = [];
$phpFiles = p3files($packageRoot, '.php');
foreach ($phpFiles as $file) {
    if (!p3lint($file)) {
        $actual[] = p3relative($file, $packageRoot);
    }
}
sort($actual);
p3verify($actual === $expected, 'whole-package PHP lint matches current cumulative legacy baseline');
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
$jsonFiles = p3files($packageRoot, '.json');
foreach ($jsonFiles as $file) {
    try {
        json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    } catch (Throwable $e) {
        $jsonFailures[] = p3relative($file, $packageRoot) . ': ' . $e->getMessage();
    }
}
p3verify($jsonFailures === [], 'all JSON files parse');
foreach ($jsonFailures as $failure) {
    echo "  {$failure}\n";
}

// Canonical runtime ownership.
$canonical = json_decode((string) file_get_contents($cfRoot . '/module.json'), true, 512, JSON_THROW_ON_ERROR);
p3verify(($canonical['active'] ?? 0) === 1 && ($canonical['canonical_domain'] ?? '') === 'feedback_resolution', 'CustomerFeedback is sole active canonical feedback_resolution runtime');

$disabled = [
    $packageRoot . '/Complaint',
    $packageRoot . '/feedback/Complaint',
    $packageRoot . '/feedback/Feedback',
    $packageRoot . '/feedback/ReviewModule',
];
foreach ($disabled as $dir) {
    $manifest = json_decode((string) file_get_contents($dir . '/module.json'), true, 512, JSON_THROW_ON_ERROR);
    p3verify(($manifest['active'] ?? 1) === 0 && ($manifest['providers'] ?? ['x']) === [], p3relative($dir, $packageRoot) . ' runtime disabled');
    p3verify(p3files($dir, '.php') === [], p3relative($dir, $packageRoot) . ' descriptor contains no executable PHP');
}

// Donor archives must remain recoverable and integrity-valid.
$donorArchives = [
    $packageRoot . '/LegacyDonors/Complaint-Pass2-Source.zip',
    $packageRoot . '/LegacyDonors/feedback-Complaint-Pass2-Source.zip',
    $packageRoot . '/LegacyDonors/feedback-Feedback-Pass2-Source.zip',
    $packageRoot . '/LegacyDonors/ReviewModule-Pass2-Source.zip',
];
foreach ($donorArchives as $archive) {
    $out = [];
    exec('unzip -tqq ' . escapeshellarg($archive) . ' 2>&1', $out, $code);
    p3verify(is_file($archive) && $code === 0, basename($archive) . ' preserved and integrity-valid');
}

// No executable legacy complaint/feedback/review or direct WorkRequest coupling.
$runtimeText = '';
$forbiddenRefs = [];
foreach (p3runtimeFiles($packageRoot) as $file) {
    $text = (string) file_get_contents($file);
    $runtimeText .= $text;
    if (
        str_contains($text, 'Modules\\Complaint\\') ||
        str_contains($text, 'Modules\\Feedback\\') ||
        str_contains($text, 'Modules\\ReviewModule\\') ||
        str_contains($text, 'Modules\\Engineerings\\Entities\\WorkRequest')
    ) {
        $forbiddenRefs[] = p3relative($file, $packageRoot);
    }
}
p3verify($forbiddenRefs === [], 'no executable legacy feedback/complaint/review or WorkRequest coupling remains');
foreach ($forbiddenRefs as $file) {
    echo "  {$file}\n";
}

// Canonical capabilities must normalize through the assurance registry.
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
    $config = require $cfRoot . '/Config/titanzero.php';
    $registry = new Modules\TitanZeroAssurance\Services\CapabilityRegistry();
    $registry->registerModuleFromArray('CustomerFeedback', (array) ($config['capabilities'] ?? []));
    $capabilityCount = count($registry->all());
    p3verify($capabilityCount >= 13, 'CustomerFeedback exposes at least 13 normalized Titan Zero capabilities');
} catch (Throwable $e) {
    p3verify(false, 'CustomerFeedback exposes at least 13 normalized Titan Zero capabilities');
    echo '  ' . $e->getMessage() . "\n";
}

// Explicit company boundary and secret safety across touched runtime.
$touchedRuntime = '';
foreach (array_merge(p3runtimeFiles($cfRoot), p3runtimeFiles($packageRoot . '/QualityControl'), p3runtimeFiles($packageRoot . '/TitanZeroAssurance')) as $file) {
    $touchedRuntime .= (string) file_get_contents($file);
}
p3verify(!str_contains($touchedRuntime, 'tenant_company_id'), 'Pass 3 canonical runtime introduces no tenant_company_id');
p3verify(!preg_match('/company[_ ]?id\s*\?\?\s*\$?user/i', $touchedRuntime), 'Pass 3 canonical runtime introduces no user-id-as-company fallback');

$emailModel = (string) file_get_contents($cfRoot . '/Entities/FeedbackEmailSetting.php');
$emailController = (string) file_get_contents($cfRoot . '/Http/Controllers/FeedbackEmailSettingController.php');
$emailView = (string) file_get_contents($cfRoot . '/Resources/views/settings/email.blade.php');
p3verify(str_contains($emailModel, "'imap_password' => 'encrypted'"), 'IMAP credential is encrypted at rest through model cast');
p3verify(str_contains($emailController, "'imap_password' => 'nullable|string'"), 'existing IMAP credential can be retained without retransmission');
p3verify(!preg_match('/value\s*=\s*["\'][^"\']*imap_password/i', $emailView), 'stored IMAP credential is never rendered back to browser');

// Survey submission must stay authenticated until signed respondent-token support exists.
$webRoutes = (string) file_get_contents($cfRoot . '/Routes/web.php');
$apiRoutes = (string) file_get_contents($cfRoot . '/Routes/api.php');
p3verify(!str_contains($webRoutes . $apiRoutes, 'withoutMiddleware'), 'survey routes do not bypass authentication middleware');
p3verify(str_contains($webRoutes, "middleware(['web', 'auth'])") && str_contains($apiRoutes, "middleware('auth:api')"), 'web/API survey response routes remain authenticated');

// Canonical feedback tables may only be created by CustomerFeedback.
$ownerViolations = [];
$feedbackTablePattern = "/Schema::create\\(['\"](?:feedback_tickets|feedback_replies|feedback_channels|feedback_types|feedback_groups|feedback_agent_groups|feedback_files|feedback_tags_list|feedback_tags|feedback_reply_templates|feedback_custom_forms|feedback_email_settings|nps_surveys|nps_responses|csat_surveys|csat_responses|feedback_insights|complaints|reviews|feedback_items)/";
foreach ($phpFiles as $file) {
    $relative = p3relative($file, $packageRoot);
    if (str_starts_with($relative, 'feedback/CustomerFeedback/')) {
        continue;
    }
    $text = (string) file_get_contents($file);
    if (preg_match($feedbackTablePattern, $text)) {
        $ownerViolations[] = $relative;
    }
}
p3verify($ownerViolations === [], 'no executable module outside CustomerFeedback creates canonical/legacy feedback tables');
foreach ($ownerViolations as $file) {
    echo "  {$file}\n";
}

// QualityControl must integrate through canonical FeedbackTicket only.
$qcBridgeFiles = [
    $packageRoot . '/QualityControl/Domain/Quality/Actions/CreateComplaintFromQcFailureAction.php',
    $packageRoot . '/QualityControl/Domain/Quality/Actions/CreateQcFromComplaintAction.php',
    $packageRoot . '/QualityControl/Listeners/VerificationCompletedListener.php',
];
$qcBridgeText = '';
foreach ($qcBridgeFiles as $file) {
    $qcBridgeText .= (string) file_get_contents($file);
}
p3verify(str_contains($qcBridgeText, 'Modules\\CustomerFeedback\\Entities\\FeedbackTicket'), 'QualityControl complaint bridge targets canonical FeedbackTicket');
p3verify(!str_contains($qcBridgeText, 'Modules\\Complaint\\'), 'QualityControl complaint bridge has no legacy Complaint dependency');

// Governed work bridge must use Assurance request/authority/dispatcher boundary.
$workService = (string) file_get_contents($cfRoot . '/Services/FeedbackWorkItemService.php');
p3verify(str_contains($workService, 'WorkItemRequest') && str_contains($workService, 'AuthorityPolicy') && str_contains($workService, 'WorkItemDispatcher'), 'corrective work flows through Titan Zero governed Work Item boundary');
p3verify(!str_contains($workService, 'WorkRequest'), 'corrective work service does not directly create legacy WorkRequest records');

echo "\nSUMMARY\n";
echo 'PHP files: ' . count($phpFiles) . "\n";
echo 'Legacy PHP failures: ' . count($actual) . "\n";
echo 'JSON files: ' . count($jsonFiles) . "\n";
echo 'CustomerFeedback capabilities: ' . $capabilityCount . "\n";
echo 'Quarantined donor archives: ' . count($donorArchives) . "\n";

if ($failures !== []) {
    echo 'PASS3_VERIFY: FAIL (' . count($failures) . " checks failed)\n";
    exit(1);
}

echo "PASS3_VERIFY: PASS\n";
