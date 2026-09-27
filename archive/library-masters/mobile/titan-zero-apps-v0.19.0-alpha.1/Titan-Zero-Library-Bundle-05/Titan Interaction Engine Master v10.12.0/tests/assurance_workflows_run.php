<?php

declare(strict_types=1);

$root = dirname(__DIR__);

spl_autoload_register(static function (string $class) use ($root): void {
    $prefixes = [
        'App\\Extensions\\InteractionEngine\\System\\Engines\\' => $root . '/System/Engines/',
        'App\\Extensions\\InteractionEngine\\System\\' => $root . '/System/',
    ];
    foreach ($prefixes as $prefix => $base) {
        if (!str_starts_with($class, $prefix)) {
            continue;
        }
        $relative = substr($class, strlen($prefix));
        $path = $base . str_replace('\\', '/', $relative) . '.php';
        if (is_file($path)) {
            require_once $path;
        }
        return;
    }
});

$tests = [];
$test = static function (string $name, callable $fn) use (&$tests): void { $tests[$name] = $fn; };
$assert = static function (bool $condition, string $message = 'Assertion failed'): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
};

$makeEngine = static function () use ($root): array {
    $registry = new App\Extensions\InteractionEngine\System\Wizard\WizardRegistry();
    $registry->discover($root . '/resources/wizards');
    $outbox = new App\Extensions\InteractionEngine\System\Wizard\Offline\LocalCommandOutbox('assurance-test-secret');
    $engine = new App\Extensions\InteractionEngine\System\Wizard\UniversalWizardEngine(
        $registry,
        new App\Extensions\InteractionEngine\System\Wizard\Validation\WizardValidationEngine(),
        new App\Extensions\InteractionEngine\System\Wizard\Guidance\LocalGuidanceProvider(),
        new App\Extensions\InteractionEngine\System\Wizard\Command\CommandMapper(new App\Extensions\InteractionEngine\System\Authority\ApprovalSigner('assurance-workflow-approval-secret')),
        $outbox,
    );
    return [$registry, $outbox, $engine];
};

$submit = static function (
    App\Extensions\InteractionEngine\System\Wizard\UniversalWizardEngine $engine,
    App\Extensions\InteractionEngine\System\Wizard\WizardSession $session,
    array $steps,
): App\Extensions\InteractionEngine\System\Wizard\WizardResult {
    $result = null;
    foreach ($steps as $input) {
        $result = $engine->submitStep($session, $input);
        if ($result->errors !== []) {
            return $result;
        }
        $session = $result->session;
    }
    if (!$result instanceof App\Extensions\InteractionEngine\System\Wizard\WizardResult) {
        throw new RuntimeException('No wizard steps were submitted.');
    }
    return $result;
};

$validContext = [
    'company_id' => 'tenant-a',
    'user_id' => 'user-17',
    'device_id' => 'device-mobile-4',
    'correlation_id' => 'corr-incident-001',
    'causation_id' => 'job-431',
    'actor_type' => 'human',
    'roles' => ['supervisor'],
];

$incidentSteps = static function (string $risk = 'medium', bool $includeGovernance = true): array {
    $steps = [
        ['job_id' => 'job-431', 'site_id' => 'site-8', 'occurred_at' => '2026-08-03T01:15:00+10:00'],
        ['incident_type' => 'property_damage', 'risk_level' => $risk, 'summary' => 'Water leak found behind laundry cabinet.'],
        ['people_affected' => false, 'injury_details' => '', 'environmental_impact' => true, 'environmental_details' => 'Approximately two litres reached a floor drain.'],
        ['immediate_controls' => ['isolated water', 'placed absorbent barrier'], 'emergency_services_contacted' => false, 'regulator_notification_required' => false],
        ['evidence_attachment_ids' => $includeGovernance ? ['asset-photo-1', 'asset-photo-2'] : [], 'witness_details' => ['worker-19']],
        ['escalation_owner_id' => 'supervisor-2', 'follow_up_required' => true],
        [
            'approval_id' => $includeGovernance ? 'approval-991' : '',
            'approved_by' => $includeGovernance ? 'manager-7' : '',
            'approved_at' => $includeGovernance ? '2026-08-03T01:20:00+10:00' : '',
            'declaration_accepted' => true,
        ],
    ];
    return $steps;
};

$inspectionSteps = static function (int $criticalCount = 0, bool $includeGovernance = true): array {
    return [
        ['site_id' => 'site-8', 'inspection_type' => 'post_service', 'inspected_at' => '2026-08-03T01:40:00+10:00'],
        ['checklist_id' => 'checklist-clean-14', 'passed_item_count' => 18, 'failed_item_count' => $criticalCount > 0 ? 2 : 0, 'critical_finding_count' => $criticalCount],
        ['findings' => $criticalCount > 0 ? [['code' => 'CHEM-01', 'severity' => 'critical', 'summary' => 'Unlabelled chemical container']] : [], 'evidence_attachment_ids' => $includeGovernance ? ['inspection-photo-1'] : []],
        [
            'corrective_actions' => $criticalCount > 0 ? [['summary' => 'Remove container and retrain worker']] : [],
            'corrective_action_owner_id' => $includeGovernance && $criticalCount > 0 ? 'worker-9' : '',
            'corrective_action_due_at' => $includeGovernance && $criticalCount > 0 ? '2026-08-03T04:00:00+10:00' : '',
            'verification_method' => $criticalCount > 0 ? 'supervisor_photo_review' : 'not_required',
        ],
        [
            'approval_id' => $includeGovernance && $criticalCount > 0 ? 'approval-992' : '',
            'approved_by' => $includeGovernance && $criticalCount > 0 ? 'manager-7' : '',
            'approved_at' => $includeGovernance && $criticalCount > 0 ? '2026-08-03T01:50:00+10:00' : '',
            'declaration_accepted' => true,
        ],
    ];
};

$test('assurance wizards and ready templates are discoverable', function () use ($root, $makeEngine, $assert): void {
    [$registry] = $makeEngine();
    $assert($registry->has('incident_response_v1'), 'Incident Response wizard is missing.');
    $assert($registry->has('inspection_corrective_action_v1'), 'Inspection/Corrective Action wizard is missing.');

    $templates = new App\Extensions\InteractionEngine\System\Template\TemplateRegistry();
    $templates->discover($root . '/resources/templates');
    foreach (['incident-response', 'inspection-corrective-action'] as $templateId) {
        $template = $templates->get($templateId);
        $assert($template->status === 'ready', "{$templateId} must be ready after verification.");
        $assert($registry->has($template->entryWizard), "{$templateId} references a missing entry wizard.");
    }
});

$test('wizard execution context trusts authenticated identity over request tenant data', function () use ($assert): void {
    $factory = new App\Extensions\InteractionEngine\System\Wizard\Context\WizardExecutionContextFactory();
    $context = $factory->build(
        ['id' => 'user-17', 'company_id' => 'tenant-a', 'roles' => ['supervisor']],
        ['company_id' => 'tenant-b', 'company_id' => 'tenant-b', 'device_id' => 'request-device', 'correlation_id' => 'corr-request'],
        ['X-Device-ID' => 'header-device', 'X-Correlation-ID' => 'corr-header'],
    );
    $assert(($context['company_id'] ?? null) === 'tenant-a', 'Request tenant must not override authenticated company.');
    $assert(($context['company_id'] ?? null) === 'tenant-a', 'Trusted company_id must be propagated into wizard context.');
    $assert(($context['user_id'] ?? null) === 'user-17', 'Authenticated actor ID was not preserved.');
    $assert(($context['device_id'] ?? null) === 'header-device', 'Trusted device header should outrank request data.');
    $assert(($context['correlation_id'] ?? null) === 'corr-header', 'Correlation header should be preserved.');
    $assert(($context['actor_type'] ?? null) === 'human', 'Authenticated API actor should be human.');
});

$test('wizard session access is denied across tenant or actor boundaries', function () use ($makeEngine, $validContext, $assert): void {
    [, , $engine] = $makeEngine();
    $session = $engine->start('incident_response_v1', $validContext);
    $policy = new App\Extensions\InteractionEngine\System\Wizard\Security\WizardSessionAccessPolicy();
    $assert($policy->mayAccess($session, $validContext), 'Owning actor should access its session.');
    $assert(!$policy->mayAccess($session, array_replace($validContext, ['company_id' => 'tenant-b', 'company_id' => 'tenant-b'])), 'Cross-tenant access must be denied.');
    $assert(!$policy->mayAccess($session, array_replace($validContext, ['user_id' => 'user-99'])), 'Cross-actor access must be denied.');
});

$test('wizard HTTP controller enforces trusted context and session ownership', function () use ($root, $assert): void {
    $controller = (string) file_get_contents($root . '/System/Http/Controllers/WizardController.php');
    $assert(str_contains($controller, 'WizardExecutionContextFactory'), 'Wizard controller does not use the trusted context factory.');
    $assert(str_contains($controller, 'WizardSessionAccessPolicy'), 'Wizard controller does not enforce session access policy.');
    $assert(substr_count($controller, 'mayAccess(') >= 2, 'Both session read and submission endpoints must enforce access.');
});

$test('incident completion fails closed without tenant and actor context', function () use ($makeEngine, $submit, $incidentSteps, $assert): void {
    [, $outbox, $engine] = $makeEngine();
    $session = $engine->start('incident_response_v1', ['device_id' => 'device-1', 'correlation_id' => 'corr-1']);
    $result = $submit($engine, $session, $incidentSteps());
    $assert(!$result->complete, 'Actor-less incident must not complete.');
    $assert(isset($result->errors['_governance']), 'Governance failure must be returned as a structured error.');
    $assert($outbox->pending() === [], 'Denied incident must not be queued.');
});

$test('high-risk incident requires evidence and explicit human approval', function () use ($makeEngine, $submit, $incidentSteps, $validContext, $assert): void {
    [, $outbox, $engine] = $makeEngine();
    $session = $engine->start('incident_response_v1', $validContext);
    $result = $submit($engine, $session, $incidentSteps('high', false));
    $assert(!$result->complete, 'High-risk incident without approval must not complete.');
    $messages = implode(' ', $result->errors['_governance'] ?? []);
    $assert(str_contains(strtolower($messages), 'evidence'), 'Governance error must identify missing evidence.');
    $assert(str_contains(strtolower($messages), 'approval'), 'Governance error must identify missing approval.');
    $assert($outbox->pending() === [], 'Denied incident must not be queued.');
});

$test('approved high-risk incident queues an encrypted replay-safe command', function () use ($makeEngine, $submit, $incidentSteps, $validContext, $assert): void {
    [, $outbox, $engine] = $makeEngine();
    $session = $engine->start('incident_response_v1', $validContext);
    $result = $submit($engine, $session, $incidentSteps('high', true));
    $assert($result->complete, 'Approved incident should complete.');
    $assert(count($outbox->pending()) === 1, 'Exactly one incident command should be queued.');
    $command = $outbox->decrypt($outbox->pending()[0]);
    $assert(($command['capability'] ?? null) === 'crm.form.submit', 'Wrong incident capability.');
    $context = $command['payload']['_context'] ?? [];
    foreach (['company_id', 'company_id', 'user_id', 'device_id', 'wizard_run_id', 'correlation_id', 'causation_id', 'idempotency_key', 'template_id', 'template_version'] as $key) {
        $assert(isset($context[$key]) && $context[$key] !== '', "Missing command context: {$key}");
    }
    $assert(($context['company_id'] ?? null) === 'tenant-a', 'Company context was not preserved.');
    $assert(($context['company_id'] ?? null) === 'tenant-a', 'Company alias was not preserved.');
    $assert(($context['causation_id'] ?? null) === 'job-431', 'Causation context was not preserved.');
});

$test('critical inspection requires evidence owner due date and approval', function () use ($makeEngine, $submit, $inspectionSteps, $validContext, $assert): void {
    [, $outbox, $engine] = $makeEngine();
    $context = array_replace($validContext, ['correlation_id' => 'corr-inspection-001']);
    $session = $engine->start('inspection_corrective_action_v1', $context);
    $result = $submit($engine, $session, $inspectionSteps(1, false));
    $assert(!$result->complete, 'Critical inspection without corrective governance must not complete.');
    $messages = strtolower(implode(' ', $result->errors['_governance'] ?? []));
    foreach (['evidence', 'owner', 'due', 'approval'] as $needle) {
        $assert(str_contains($messages, $needle), "Governance error must mention {$needle}.");
    }
    $assert($outbox->pending() === [], 'Denied inspection must not be queued.');
});

$test('governed inspection queues structured findings and corrective actions', function () use ($makeEngine, $submit, $inspectionSteps, $validContext, $assert): void {
    [, $outbox, $engine] = $makeEngine();
    $context = array_replace($validContext, ['correlation_id' => 'corr-inspection-002']);
    $session = $engine->start('inspection_corrective_action_v1', $context);
    $result = $submit($engine, $session, $inspectionSteps(1, true));
    $assert($result->complete, 'Governed critical inspection should complete.');
    $command = $outbox->decrypt($outbox->pending()[0]);
    $assert(($command['capability'] ?? null) === 'crm.form.submit', 'Wrong inspection capability.');
    $assert(count($command['payload']['findings'] ?? []) === 1, 'Finding was not preserved.');
    $assert(count($command['payload']['corrective_actions'] ?? []) === 1, 'Corrective action was not preserved.');
    $assert(($command['payload']['corrective_action_owner_id'] ?? null) === 'worker-9', 'Corrective action owner was not preserved.');
});

$passed = 0;
$failed = 0;
foreach ($tests as $name => $fn) {
    try {
        $fn();
        echo "PASS {$name}\n";
        $passed++;
    } catch (Throwable $error) {
        echo "FAIL {$name}: {$error->getMessage()}\n";
        $failed++;
    }
}

echo "\n{$passed}/" . count($tests) . " assurance tests passed\n";
exit($failed === 0 ? 0 : 1);
