<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void {
    if (!$condition) $failures[] = $message;
};

$config = file_get_contents($root . '/config/interaction-engine.php') ?: '';
$check(str_contains($config, "'profile' => ["), 'Phase 5 must define an explicit product profile.');
$check(str_contains($config, "'id' => 'field_home_services'"), 'The active product profile must be field_home_services.');
$check(str_contains($config, "'company_id'"), 'company_id must remain the company boundary.');
$check(!str_contains($config, "'team_id' => 'tenant'"), 'team_id must never be configured as company identity.');

$profilePath = $root . '/System/Profile/FieldHomeServicesProfile.php';
$check(is_file($profilePath), 'FieldHomeServicesProfile is missing.');
$profile = is_file($profilePath) ? (file_get_contents($profilePath) ?: '') : '';
$check(str_contains($profile, 'cleaning'), 'Field/home services profile must include cleaning.');
$check(str_contains($profile, 'plumbing'), 'Field/home services profile must include plumbing.');
$check(str_contains($profile, 'electrical'), 'Field/home services profile must include electrical.');
$check(str_contains($profile, 'hvac'), 'Field/home services profile must include HVAC.');
$check(str_contains($profile, 'landscaping'), 'Field/home services profile must include landscaping.');
$check(str_contains($profile, 'pest-control'), 'Field/home services profile must include pest control.');
$check(str_contains($profile, 'field_home_services_onboarding_v1'), 'Field/home services onboarding must be part of the active wizard surface.');
$check(!str_contains($profile, "'commerce.orders.create'"), 'E-commerce capabilities must not be part of the active field/home services profile.');
$check(!str_contains($profile, "'hospitality.bookings.create'"), 'Hospitality capabilities must not be part of the active field/home services profile.');
$check(!str_contains($profile, "'care.clients.intake'"), 'Care capabilities must not be part of the active field/home services profile.');

$catalogPath = $root . '/resources/onboarding/field-home-services-question-catalog.json';
$check(is_file($catalogPath), 'Field/home services onboarding question catalogue is missing.');
$catalog = is_file($catalogPath) ? json_decode((string) file_get_contents($catalogPath), true) : null;
$check(is_array($catalog), 'Onboarding question catalogue must be valid JSON.');
if (is_array($catalog)) {
    $check(count($catalog) >= 116, 'The full onboarding catalogue must retain the runtime question coverage from the supplied source catalogue.');
    $keys = array_values(array_filter(array_map(static fn(array $q): ?string => $q['key'] ?? null, $catalog)));
    foreach (['company.name','company.abn','business.operating_model','territory.method','catalogue.service_name','booking.photo_evidence','payments.invoice_terms','workforce.owner_role','notification.booking_alerts','ai.authority','compliance.evidence','activation.go_live'] as $requiredKey) {
        $check(in_array($requiredKey, $keys, true), "Onboarding catalogue is missing {$requiredKey}.");
    }
}

$wizardPath = $root . '/resources/wizards/field_home_services_onboarding.json';
$check(is_file($wizardPath), 'Full field/home services onboarding wizard definition is missing.');
$wizard = is_file($wizardPath) ? json_decode((string) file_get_contents($wizardPath), true) : null;
if (is_array($wizard)) {
    $w = $wizard['wizard'] ?? [];
    $check(($w['id'] ?? '') === 'field_home_services_onboarding_v1', 'Unexpected onboarding wizard id.');
    $check(($w['capability'] ?? '') === 'interaction.onboarding.compile', 'Onboarding wizard must compile a company-scoped activation plan before executing it.');
    $check(count((array) ($w['steps'] ?? [])) === 16, 'Full onboarding wizard must contain the 16 supplied onboarding sections.');
    $check(in_array('field_services', (array) ($w['metadata']['verticals'] ?? []), true), 'Onboarding wizard must be field-services scoped.');
    $check(in_array('home_services', (array) ($w['metadata']['verticals'] ?? []), true), 'Onboarding wizard must be home-services scoped.');
}

foreach ([
    'System/Onboarding/OnboardingAction.php',
    'System/Onboarding/OnboardingPlan.php',
    'System/Onboarding/OnboardingPlanCompiler.php',
    'System/Onboarding/OnboardingActionExecutor.php',
    'System/Onboarding/OnboardingExecutionResult.php',
    'System/Onboarding/Storage/OnboardingPlanStoreInterface.php',
    'System/Onboarding/Storage/CacheOnboardingPlanStore.php',
    'System/Http/Controllers/FieldServicesOnboardingController.php',
] as $relative) {
    $check(is_file($root . '/' . $relative), "Missing onboarding execution component: {$relative}");
}

$compilerPath = $root . '/System/Onboarding/OnboardingPlanCompiler.php';
$compilerSource = is_file($compilerPath) ? (file_get_contents($compilerPath) ?: '') : '';
$check(str_contains($compilerSource, 'companyId'), 'Onboarding compiler must require company_id.');
$check(str_contains($compilerSource, 'destinations'), 'Onboarding compiler must route answers using data-driven destination metadata.');
$check(str_contains($compilerSource, 'onboarding_group'), 'Onboarding compiler must preserve conceptual onboarding groups from question metadata.');
$check(str_contains($compilerSource, 'interaction.onboarding.activate'), 'Onboarding compiler must end with an activation action.');

// Canonical provider ownership is expressed in the data-driven wizard definition.
$wizardSource = is_file($wizardPath) ? (file_get_contents($wizardPath) ?: '') : '';
foreach (['crm.business.profile.update','crm.business.service.create','crm.business.service_area.update','crm.staff.invite','crm.business.compliance.update'] as $capability) {
    $check(str_contains($wizardSource, $capability), "Onboarding destination metadata is missing {$capability}.");
}

$executorPath = $root . '/System/Onboarding/OnboardingActionExecutor.php';
$executorSource = is_file($executorPath) ? (file_get_contents($executorPath) ?: '') : '';
$check(str_contains($executorSource, 'CapabilityRegistry'), 'Onboarding executor must route through the capability registry.');
$check(str_contains($executorSource, 'status('), 'Onboarding executor must query canonical capability status before dispatch.');
$check(str_contains($executorSource, "'unavailable'"), 'Onboarding executor must fail closed when an owning provider capability is unavailable.');
$check(str_contains($executorSource, 'approvalStore'), 'Onboarding executor must require server-side approval evidence for grouped actions.');
$check(str_contains($executorSource, 'companyId()'), 'Onboarding executor must compare the plan against trusted company_id.');

$controllerPath = $root . '/System/Http/Controllers/FieldServicesOnboardingController.php';
$controller = is_file($controllerPath) ? (file_get_contents($controllerPath) ?: '') : '';
$check(str_contains($controller, 'CompanyExecutionContext'), 'Onboarding controller must use trusted company context.');
$check(str_contains($controller, 'compile'), 'Onboarding controller must expose plan compilation.');
$check(str_contains($controller, 'execute'), 'Onboarding controller must expose approved execution.');
$check(str_contains($controller, 'plan_id'), 'Execution must load a server-side plan by id rather than trusting a client-supplied action plan.');

$routes = file_get_contents($root . '/routes/api.php') ?: '';
$check(str_contains($routes, '/onboarding/field-services/compile'), 'Field-services onboarding compile API route is missing.');
$check(str_contains($routes, '/onboarding/field-services/plans/{planId}'), 'Field-services onboarding plan preview API route is missing.');
$check(str_contains($routes, '/onboarding/field-services/plans/{planId}/approve'), 'Field-services onboarding server-signed approval API route is missing.');
$check(str_contains($routes, '/onboarding/field-services/execute'), 'Field-services onboarding execution API route is missing.');

if ($failures !== []) {
    fwrite(STDERR, "Phase 5 field/home services onboarding checks failed:\n - " . implode("\n - ", $failures) . "\n");
    exit(1);
}

echo "Phase 5 field/home services onboarding checks passed.\n";
