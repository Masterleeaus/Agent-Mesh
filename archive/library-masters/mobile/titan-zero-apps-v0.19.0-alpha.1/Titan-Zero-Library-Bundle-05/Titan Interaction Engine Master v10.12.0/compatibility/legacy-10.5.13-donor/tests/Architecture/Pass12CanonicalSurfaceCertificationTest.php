<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$files = [
    $root . '/System/Http/Controllers/CompanySettingsController.php',
    $root . '/System/Http/Controllers/FieldServicesOnboardingController.php',
    $root . '/System/Onboarding/OnboardingActionExecutor.php',
    $root . '/System/Http/Controllers/JourneyController.php',
];

$errors = [];
foreach ($files as $file) {
    $source = file_get_contents($file);
    if ($source === false) {
        $errors[] = 'Unreadable runtime file: ' . basename($file);
        continue;
    }
    if (preg_match("/['\"]source_surface['\"]\\s*=>\\s*['\"](?:command|onboarding|bos|owner|manager|business|field|worker|customer)['\"]/", $source)) {
        $errors[] = basename($file) . ' emits a non-canonical source_surface';
    }
}

if ($errors !== []) {
    fwrite(STDERR, "PASS12 CANONICAL SURFACE CERTIFICATION: FAIL\n - " . implode("\n - ", $errors) . "\n");
    exit(1);
}

echo "PASS12 CANONICAL SURFACE CERTIFICATION: PASS\n";
