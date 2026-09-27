<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$packageRoot = dirname(dirname($root));
$failures = [];
$checks = 0;

function p3check(bool $condition, string $label): void
{
    global $failures, $checks;
    $checks++;
    if ($condition) {
        echo "PASS: {$label}\n";
        return;
    }
    $failures[] = $label;
    echo "FAIL: {$label}\n";
}

function p3json(string $path): array
{
    return json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
}

function p3phpFiles(string $path): array
{
    if (!is_dir($path)) {
        return [];
    }
    $files = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $files[] = $file->getPathname();
        }
    }
    sort($files);
    return $files;
}

$module = p3json($root . '/module.json');
p3check(($module['active'] ?? 0) === 1, 'CustomerFeedback is active canonical runtime');
p3check(($module['canonical_domain'] ?? null) === 'feedback_resolution', 'CustomerFeedback declares canonical feedback_resolution domain');

$disabledModules = [
    $packageRoot . '/Complaint',
    $packageRoot . '/feedback/Complaint',
    $packageRoot . '/feedback/Feedback',
    $packageRoot . '/feedback/ReviewModule',
];
foreach ($disabledModules as $path) {
    $manifest = p3json($path . '/module.json');
    p3check(($manifest['active'] ?? 1) === 0 && ($manifest['providers'] ?? ['x']) === [], basename($path) . ' donor runtime is disabled');
    p3check(p3phpFiles($path) === [], basename($path) . ' donor descriptor has no executable PHP');
}

foreach ([
    'Complaint-Pass2-Source.zip',
    'feedback-Complaint-Pass2-Source.zip',
    'feedback-Feedback-Pass2-Source.zip',
    'ReviewModule-Pass2-Source.zip',
] as $archive) {
    p3check(is_file($packageRoot . '/LegacyDonors/' . $archive), $archive . ' donor source archive exists');
}

$requiredFiles = [
    'Actions/CreateComplaintAction.php',
    'Actions/EscalateComplaintAction.php',
    'Actions/ResolveComplaintAction.php',
    'AI/Tools/AnalyseComplaintTool.php',
    'AI/Tools/DraftResolutionResponseTool.php',
    'Events/ComplaintReceived.php',
    'Events/ComplaintEscalated.php',
    'Events/ComplaintResolved.php',
    'Listeners/QualityControlNeedsRecleanListener.php',
    'Services/ComplaintAnalysisService.php',
    'Services/ComplaintSlaPolicy.php',
    'Services/FeedbackWorkItemService.php',
    'Config/titanzero.php',
];
foreach ($requiredFiles as $relative) {
    p3check(is_file($root . '/' . $relative), $relative . ' exists in canonical module');
}

$workFiles = '';
foreach (p3phpFiles($packageRoot) as $file) {
    $normal = str_replace('\\', '/', $file);
    if (str_contains($normal, '/Tests/') || str_contains(basename($file), 'VERIFY_')) continue;
    $workFiles .= (string) file_get_contents($file);
}
p3check(!str_contains($workFiles, 'Modules\\Engineerings\\Entities\\WorkRequest'), 'no executable legacy WorkRequest coupling remains');
p3check(!str_contains($workFiles, 'Modules\\Complaint\\'), 'no executable Modules\\Complaint runtime references remain');
p3check(!str_contains($workFiles, 'Modules\\Feedback\\'), 'no executable Modules\\Feedback runtime references remain');
p3check(!str_contains($workFiles, 'Modules\\ReviewModule\\'), 'no executable Modules\\ReviewModule runtime references remain');

$emailModel = (string) @file_get_contents($root . '/Entities/FeedbackEmailSetting.php');
$emailController = (string) @file_get_contents($root . '/Http/Controllers/FeedbackEmailSettingController.php');
$emailView = (string) @file_get_contents($root . '/Resources/views/settings/email.blade.php');
p3check(str_contains($emailModel, "'imap_password' => 'encrypted'"), 'IMAP password uses encrypted model cast');
p3check(str_contains($emailController, "'imap_password' => 'nullable|string'"), 'IMAP password update does not require redisplaying/re-entering secret');
p3check(!preg_match('/value\s*=\s*["\'][^"\']*imap_password/i', $emailView), 'IMAP password is never rendered back into HTML value');

$qcAction = (string) @file_get_contents($packageRoot . '/QualityControl/Domain/Quality/Actions/CreateComplaintFromQcFailureAction.php');
$qcReverse = (string) @file_get_contents($packageRoot . '/QualityControl/Domain/Quality/Actions/CreateQcFromComplaintAction.php');
$qcVerify = (string) @file_get_contents($packageRoot . '/QualityControl/Listeners/VerificationCompletedListener.php');
p3check(str_contains($qcAction, 'Modules\\CustomerFeedback\\Entities\\FeedbackTicket'), 'QC failure creates canonical FeedbackTicket complaint');
p3check(str_contains($qcReverse, 'Modules\\CustomerFeedback\\Entities\\FeedbackTicket'), 'complaint follow-up QC action consumes canonical FeedbackTicket');
p3check(str_contains($qcVerify, 'Modules\\CustomerFeedback\\Entities\\FeedbackTicket'), 'QC verification resolves canonical FeedbackTicket');

$surveyControllers = (string) @file_get_contents($root . '/Http/Controllers/NpsSurveyController.php')
    . (string) @file_get_contents($root . '/Http/Controllers/CsatSurveyController.php');
p3check(str_contains($surveyControllers, '$survey->company_id'), 'public survey submission derives company from survey record');

if (is_file($root . '/Services/ComplaintAnalysisService.php')) {
    require_once $root . '/Services/ComplaintAnalysisService.php';
    $analysis = new Modules\CustomerFeedback\Services\ComplaintAnalysisService();
    $result = $analysis->analyse('Urgent refund requested', 'Poor service and invoice dispute');
    p3check($result['severity'] === 'urgent', 'complaint analysis preserves urgent severity');
    p3check($result['category'] === 'billing', 'complaint analysis preserves billing category');
}

if (is_file($root . '/Services/ComplaintSlaPolicy.php')) {
    require_once $root . '/Services/ComplaintSlaPolicy.php';
    $sla = new Modules\CustomerFeedback\Services\ComplaintSlaPolicy();
    p3check($sla->hoursForPriority('critical') < $sla->hoursForPriority('high'), 'critical complaint SLA is tighter than high');
    p3check($sla->hoursForPriority('high') < $sla->hoursForPriority('medium'), 'high complaint SLA is tighter than medium');
}

echo "CHECKS: {$checks}\n";
if ($failures !== []) {
    echo 'PASS3_CONVERGENCE_TEST: FAIL (' . count($failures) . " failed)\n";
    exit(1);
}

echo "PASS3_CONVERGENCE_TEST: PASS\n";
