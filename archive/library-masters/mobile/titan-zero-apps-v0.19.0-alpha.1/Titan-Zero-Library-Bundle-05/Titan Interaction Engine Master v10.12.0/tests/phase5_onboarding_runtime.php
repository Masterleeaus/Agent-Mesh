<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\InteractionEngine\\System\\';
    if (!str_starts_with($class, $prefix)) return;
    $path = $root . '/System/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($path)) require_once $path;
});

$tests = [];
$test = static function (string $name, callable $fn) use (&$tests): void { $tests[$name] = $fn; };
$assert = static function (bool $condition, string $message = 'Assertion failed'): void {
    if (!$condition) throw new RuntimeException($message);
};

$test('field profile exposes only field and home services runtime wizards', function () use ($root, $assert): void {
    $profile = new App\Extensions\InteractionEngine\System\Profile\FieldHomeServicesProfile();
    $registry = new App\Extensions\InteractionEngine\System\Wizard\WizardRegistry();
    $registry->discover($root . '/resources/wizards');
    $registry->retain(static fn($wizard): bool => $profile->allowsWizard($wizard));
    $assert($registry->has('field_home_services_onboarding_v1'), 'Onboarding wizard must be active.');
    $assert($registry->has('service_booking_v1'), 'Field service booking must be active.');
    $assert($registry->has('create_job_v1'), 'Job creation must be active.');
    $assert(!$registry->has('customer_order_capture_v1'), 'E-commerce order capture must not be active.');
    $assert(!$registry->has('guest_issue_resolution_v1'), 'Hospitality guest issue workflow must not be active.');
    $assert(!$registry->has('client_intake_consent_v1'), 'Care intake must not be active.');
});

$test('full onboarding wizard preserves all 116 runtime questions across 16 sections', function () use ($root, $assert): void {
    $data = json_decode((string) file_get_contents($root . '/resources/wizards/field_home_services_onboarding.json'), true, 512, JSON_THROW_ON_ERROR);
    $wizard = $data['wizard'];
    $assert(count($wizard['steps']) === 16, 'Expected 16 onboarding sections.');
    $questionCount = array_sum(array_map(static fn(array $step): int => count($step['fields'] ?? []), $wizard['steps']));
    $assert($questionCount === 116, "Expected 116 runtime questions, got {$questionCount}.");
    $business = null;
    foreach ($wizard['steps'][1]['fields'] as $field) {
        if (($field['id'] ?? '') === 'business.verticals') $business = $field;
    }
    $assert(is_array($business), 'Business type question is missing.');
    $assert(in_array('plumbing', $business['allowed_values'] ?? [], true), 'Plumbing must be an allowed field-service type.');
    $assert(!in_array('hospitality', $business['allowed_values'] ?? [], true), 'Hospitality must not be selectable.');
});

$test('onboarding compiler creates company scoped preview actions and activation last', function () use ($assert): void {
    $compiler = new App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlanCompiler();
    $context = ['company_id' => '42', 'company_id' => '42', 'user_id' => '7', 'actor_type' => 'human', 'roles' => ['owner']];
    $plan = $compiler->compile('42', [
        'company.name' => 'Example Plumbing',
        'business.verticals' => ['plumbing'],
        'territory.postcodes' => ['3000'],
        'catalogue.service_name' => 'Blocked drain',
        'payments.invoice_terms' => '7 days',
        'compliance.evidence' => ['before_photo', 'after_photo'],
        'activation.go_live' => 'activate',
    ], 'wizard-session-1', $context);
    $assert($plan->id === 'wizard-session-1', 'Wizard session id should become the stored onboarding plan id.');
    $assert($plan->companyId === '42', 'Plan company_id mismatch.');
    $caps = array_map(static fn($a): string => $a->capability, $plan->actions);
    foreach (['crm.business.profile.update','crm.business.service_area.update','crm.business.service.create','crm.business.payment_settings.update','crm.business.compliance.update'] as $capability) {
        $assert(in_array($capability, $caps, true), "Missing compiled action {$capability}.");
    }
    $last = $plan->actions[array_key_last($plan->actions)];
    $assert($last->capability === 'interaction.onboarding.activate', 'Activation must be the final action.');
    $assert($last->requiresApproval, 'Activation must require explicit approval.');
    foreach ($plan->actions as $action) {
        $assert(($action->payload['_context']['company_id'] ?? null) === '42', 'Every onboarding action must carry trusted company_id.');
        $assert(($action->payload['_context']['company_id'] ?? null) === '42', 'Legacy company_id may only mirror company_id.');
    }
});

$test('onboarding compiler rejects a mismatched tenant alias', function () use ($assert): void {
    $compiler = new App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlanCompiler();
    try {
        $compiler->compile('42', ['company_id' => '99', 'company.name' => 'Wrong Co']);
        $assert(false, 'Mismatched tenant alias should fail.');
    } catch (RuntimeException $e) {
        $assert(str_contains($e->getMessage(), 'company_id'), 'Mismatch error must identify company boundary.');
    }
});

$test('onboarding executor enforces approvals and routes executable actions through governed capability boundary', function () use ($assert): void {
    $providers = new App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderRegistry();
    $router = new App\Extensions\InteractionEngine\System\Capabilities\CapabilityRouter($providers, new App\Extensions\InteractionEngine\System\Capabilities\CapabilityAliasRegistry());
    $registry = new App\Extensions\InteractionEngine\System\Registry\CapabilityRegistry($router);
    $registry->register('crm.business.profile.update', static fn(array $payload): array => ['ok' => true]);
    $registry->register('interaction.onboarding.activate', static fn(array $payload): array => ['ok' => true]);
    $bus = new class implements App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface {
        public array $dispatched = [];
        public function dispatch(string $capability, array $payload): void { $this->dispatched[] = $capability; }
        public function registerHandler(string $capability, callable $handler): void {}
        public function hasHandler(string $capability): bool { return in_array($capability, ['crm.business.profile.update','interaction.onboarding.activate'], true); }
    };
    $company = new App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext('42');
    $executor = new App\Extensions\InteractionEngine\System\Onboarding\OnboardingActionExecutor($registry, $bus, $company);
    $plan = new App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlan('p1','42',[
        new App\Extensions\InteractionEngine\System\Onboarding\OnboardingAction('a1','company','crm.business.profile.update','section',false,['_context'=>['company_id'=>'42','company_id'=>'42']],'crm'),
        new App\Extensions\InteractionEngine\System\Onboarding\OnboardingAction('a2','activation','interaction.onboarding.activate','critical',true,['_context'=>['company_id'=>'42','company_id'=>'42']],'interaction',['a1'],1000),
    ], gmdate(DATE_ATOM));
    $result = $executor->execute($plan, [], [
        'company_id' => '42','company_id' => '42','user_id' => 'owner-7','actor_type' => 'human','roles' => ['owner'],
    ]);
    $data = $result->toArray();
    $assert($data['summary']['executed'] === 1, 'Low-risk company draft action should execute.');
    $assert($data['summary']['pending_approval'] === 1, 'Activation must remain pending without approval.');
    $assert($bus->dispatched === ['crm.business.profile.update'], 'Unapproved activation must not dispatch.');
});

$test('secure onboarding tasks store connection status only and never raw credentials', function () use ($root, $assert): void {
    $data = json_decode((string) file_get_contents($root . '/resources/wizards/field_home_services_onboarding.json'), true, 512, JSON_THROW_ON_ERROR);
    $fields = [];
    foreach ($data['wizard']['steps'] as $step) {
        foreach ($step['fields'] as $field) $fields[$field['source_key'] ?? $field['id']] = $field;
    }
    foreach (['payments.bank_details','payments.gateway_connection','email.connect','sms.connect','ai.credentials','maps.credentials','storage.credentials'] as $sourceKey) {
        $field = $fields[$sourceKey] ?? null;
        $assert(is_array($field), "Secure task {$sourceKey} is missing.");
        $assert(($field['sensitive_input_disallowed'] ?? false) === true, "Secure task {$sourceKey} must reject raw secret input.");
        $assert(str_ends_with((string) ($field['id'] ?? ''), '.connection_status'), "Secure task {$sourceKey} must persist connection status only.");
    }
    $compiler = new App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlanCompiler();
    $plan = $compiler->compile('42', [
        'ai.credentials' => 'fixture-secret-must-never-survive',
        'ai.credentials.connection_status' => 'connected',
        'activation.go_live' => 'draft',
    ]);
    $encoded = json_encode($plan->toArray(), JSON_THROW_ON_ERROR);
    $assert(!str_contains($encoded, 'fixture-secret-must-never-survive'), 'Raw credential material must be dropped by the onboarding compiler.');
    $assert(str_contains($encoded, 'connected'), 'Safe connection status should remain in the plan.');
});


$test('wizard input filtering drops undeclared fields before session persistence', function () use ($assert): void {
    $validator = new App\Extensions\InteractionEngine\System\Wizard\Validation\WizardValidationEngine();
    $filtered = $validator->filterStepInput([
        'id' => 'secure',
        'fields' => [['id' => 'ai.credentials.connection_status', 'type' => 'text']],
    ], [
        'ai.credentials.connection_status' => 'connected',
        'ai.credentials' => 'fixture-secret-should-be-dropped',
        'unexpected' => 'also-drop',
    ]);
    $assert($filtered === ['ai.credentials.connection_status' => 'connected'], 'Only declared wizard fields may be persisted.');
});

$passed = $failed = 0;
foreach ($tests as $name => $fn) {
    try { $fn(); echo "PASS {$name}\n"; $passed++; }
    catch (Throwable $e) { echo "FAIL {$name}: {$e->getMessage()}\n"; $failed++; }
}
echo "\n{$passed}/" . count($tests) . " Phase 5 onboarding runtime tests passed\n";
exit($failed === 0 ? 0 : 1);
