<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$runtimeFiles = [
    $root . '/System/Services/Sync/ChatbotSyncService.php',
    $root . '/System/Observers/Sync/ChatbotSyncObserver.php',
    $root . '/System/Http/Controllers/Api/Sync/ChatbotDeviceController.php',
    $root . '/System/Http/Controllers/Api/Sync/ChatbotSyncController.php',
];

$errors = [];
foreach ($runtimeFiles as $file) {
    $source = file_get_contents($file);
    if ($source === false) {
        $errors[] = 'Unreadable runtime file: ' . basename($file);
        continue;
    }
    if (preg_match("/where\\(\\s*['\"]tenant_id['\"]/", $source)) {
        $errors[] = basename($file) . ' still queries tenant_id as an authority boundary';
    }
    if (preg_match("/['\"]tenant_id['\"]\\s*=>/", $source)) {
        $errors[] = basename($file) . ' still writes tenant_id as an authority boundary';
    }
}

$service = file_get_contents($root . '/System/Services/Sync/ChatbotSyncService.php') ?: '';
if (!str_contains($service, 'public function companyId(')) {
    $errors[] = 'ChatbotSyncService does not expose canonical companyId resolution';
}
if (preg_match('/\$user->tenant_id|\$user->team_id/', $service)) {
    $errors[] = 'ChatbotSyncService still derives authority from a legacy tenant/team field';
}

$observer = file_get_contents($root . '/System/Observers/Sync/ChatbotSyncObserver.php') ?: '';
if (preg_match('/\$user->tenant_id|\$user->team_id/', $observer)) {
    $errors[] = 'ChatbotSyncObserver still derives authority from a legacy tenant/team field';
}

$migrations = glob($root . '/database/migrations/*chatbot*company*boundary*.php') ?: [];
if ($migrations === []) {
    $errors[] = 'No forward migration converts legacy Chatbot sync tenancy columns to company_id';
}

if ($errors !== []) {
    fwrite(STDERR, "PASS12 COMPANY BOUNDARY CERTIFICATION: FAIL\n - " . implode("\n - ", $errors) . "\n");
    exit(1);
}

echo "PASS12 COMPANY BOUNDARY CERTIFICATION: PASS\n";
