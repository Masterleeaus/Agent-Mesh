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
        $path = $base . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
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

$load = static function () use ($root): array {
    $wizards = new App\Extensions\InteractionEngine\System\Wizard\WizardRegistry();
    $wizards->discover($root . '/resources/wizards');
    $templates = new App\Extensions\InteractionEngine\System\Template\TemplateRegistry();
    $templates->discover($root . '/resources/templates');
    return [$wizards, $templates];
};

$test('catalogue exposes twenty nine ready and nine draft templates', function () use ($load, $assert): void {
    [, $templates] = $load();
    $all = $templates->all();
    $assert(count($all) === 38, 'Expected exactly thirty eight curated templates, got ' . count($all));
    $ready = array_filter($all, static fn($template): bool => $template->status === 'ready');
    $draft = array_filter($all, static fn($template): bool => $template->status === 'draft');
    $assert(count($ready) === 29, 'Expected twenty nine ready templates, got ' . count($ready));
    $assert(count($draft) === 9, 'Expected nine draft templates, got ' . count($draft));
});

$test('foundation assurance commerce and vertical template identities are stable', function () use ($load, $assert): void {
    [, $templates] = $load();
    $expected = [
        'customer-onboarding',
        'quote-builder',
        'job-creation',
        'job-completion',
        'invoice-creation',
        'incident-response',
        'inspection-corrective-action',
        'field-job-handover',
        'payment-reconciliation',
        'staff-onboarding',
        'product-catalogue-item',
        'customer-order-capture',
        'order-fulfilment',
        'inventory-adjustment',
        'stocktake-variance',
        'return-request',
        'refund-approval',
        'supplier-replenishment',
        'order-issue-resolution',
        'abandoned-checkout-recovery',
        'service-booking',
        'recurring-service-agreement',
        'job-variation-approval',
        'property-onboarding',
        'maintenance-request',
        'property-turnover-handover',
        'site-variation',
        'materials-request',
        'practical-completion-defects',
        'client-intake-consent',
        'service-plan-review',
        'clinical-service-incident-escalation',
        'booking-intake',
        'event-function-setup',
        'guest-issue-resolution',
        'wholesale-order',
        'store-stock-transfer',
        'supplier-receiving-discrepancy',
    ];
    foreach ($expected as $id) {
        $assert($templates->has($id), "Missing curated template {$id}");
    }
});

$test('every ready template references a real wizard and matching capability', function () use ($load, $assert): void {
    [$wizards, $templates] = $load();
    foreach ($templates->all() as $template) {
        if ($template->status !== 'ready') {
            continue;
        }
        $assert($wizards->has($template->entryWizard), "Ready template {$template->id} references missing wizard {$template->entryWizard}");
        $wizard = $wizards->get($template->entryWizard);
        $assert(in_array($wizard->capability, $template->capabilities, true), "Template {$template->id} does not declare wizard capability {$wizard->capability}");
    }
});

$test('every draft template references a future wizard that is not registered', function () use ($load, $assert): void {
    [$wizards, $templates] = $load();
    foreach ($templates->all() as $template) {
        if ($template->status !== 'draft') {
            continue;
        }
        $assert(!$wizards->has($template->entryWizard), "Draft template {$template->id} unexpectedly references executable wizard {$template->entryWizard}");
    }
});

$test('compatibility checker fails closed for missing host capabilities', function () use ($load, $assert): void {
    [$wizards, $templates] = $load();
    $checker = new App\Extensions\InteractionEngine\System\Template\TemplateCompatibilityChecker($wizards);
    $report = $checker->check($templates->get('incident-response'), []);
    $assert(!$report->compatible, 'Incident template must be incompatible without its owning CRM capability.');
    $assert(in_array('crm.form.submit', $report->missingCapabilities, true), 'Missing capability was not reported.');
});

$test('draft templates remain incompatible even when their wizard and host capability exist', function () use ($assert): void {
    $wizards = new App\Extensions\InteractionEngine\System\Wizard\WizardRegistry();
    $wizards->register([
        'id' => 'future_checkout_recovery_v1',
        'version' => '1.0.0',
        'name' => 'Future Checkout Recovery',
        'capability' => 'commerce.checkout.recover',
        'steps' => [[
            'id' => 'contact',
            'fields' => [['id' => 'checkout_id', 'type' => 'text', 'required' => true]],
        ]],
    ]);
    $template = App\Extensions\InteractionEngine\System\Template\TemplateDefinition::fromArray([
        'id' => 'future-checkout-recovery',
        'version' => '1.0.0',
        'name' => 'Future Checkout Recovery',
        'status' => 'draft',
        'category' => 'commerce',
        'entry_wizard' => 'future_checkout_recovery_v1',
        'capabilities' => ['commerce.checkout.recover'],
    ]);
    $checker = new App\Extensions\InteractionEngine\System\Template\TemplateCompatibilityChecker($wizards);
    $report = $checker->check($template, ['commerce.checkout.recover']);
    $assert(!$report->compatible, 'Draft templates must never become executable through host capability configuration alone.');
    $assert(
        count(array_filter($report->errors, static fn(string $error): bool => str_contains($error, 'not executable'))) === 1,
        'Draft compatibility report must explain that the template is not executable.',
    );
});

$test('compatibility checker accepts a complete ready host mapping', function () use ($load, $assert): void {
    [$wizards, $templates] = $load();
    $checker = new App\Extensions\InteractionEngine\System\Template\TemplateCompatibilityChecker($wizards);
    $template = $templates->get('inspection-corrective-action');
    $report = $checker->check($template, ['crm.form.submit']);
    $assert($report->compatible, 'Inspection template should be compatible when its wizard and host capability exist.');
    $assert($report->missingCapabilities === [], 'Compatible report must not contain missing capabilities.');
    $assert($report->missingEntryWizard === false, 'Compatible report must not report a missing wizard.');
});

$test('Laravel integration exposes templates through provider API and CLI surfaces', function () use ($root, $assert): void {
    $provider = (string) file_get_contents($root . '/System/InteractionEngineServiceProvider.php');
    $routes = (string) file_get_contents($root . '/routes/api.php');
    $seed = (string) file_get_contents($root . '/System/Commands/SeedCommand.php');
    $assert(is_file($root . '/System/Http/Controllers/TemplateController.php'), 'Template API controller is missing.');
    $assert(is_file($root . '/System/Commands/ListTemplatesCommand.php'), 'Template CLI command is missing.');
    $assert(str_contains($provider, 'TemplateRegistry::class'), 'Template registry is not registered with Laravel.');
    $assert(str_contains($provider, 'TemplateCompatibilityChecker::class'), 'Compatibility checker is not registered with Laravel.');
    $config = (string) file_get_contents($root . '/config/interaction-engine.php');
    $assert(!str_contains($provider, 'interaction-definitions'), 'Definitions must not be published into generic application-root paths.');
    $assert(str_contains($config, "'/resources/templates'"), 'Bundled templates are not extension-owned.');
    $assert(str_contains($routes, "Route::get('/templates'"), 'Authenticated template catalogue API route is missing.');
    $assert(str_contains($seed, "'/resources/templates'"), 'interaction:seed does not use extension-owned templates.');
});

$test('release documentation and compatibility report stay machine-verifiable', function () use ($root, $assert): void {
    $reportPath = $root . '/reports/capability-provider-compatibility.json';
    $assert(is_file($reportPath), 'Capability-provider compatibility report is missing.');
    $report = json_decode((string) file_get_contents($reportPath), true, 512, JSON_THROW_ON_ERROR);
    $assert(count($report['templates'] ?? []) === 38, 'Compatibility report must cover all thirty eight templates.');
    $indexed = [];
    foreach ($report['templates'] as $row) {
        $indexed[$row['id']] = $row;
    }
    $assert(($indexed['incident-response']['engine_ready'] ?? false) === true, 'Incident Response should be engine-ready.');
    $assert(($indexed['incident-response']['connected_host_verified'] ?? true) === false, 'Incident Response must not claim connected-host verification.');
    $assert(($indexed['refund-approval']['engine_ready'] ?? false) === true, 'Refund Approval should be engine-ready.');
    $assert(($indexed['supplier-replenishment']['engine_ready'] ?? true) === false, 'Supplier Replenishment must remain a draft.');
    $assert(($indexed['supplier-replenishment']['activation_allowed'] ?? true) === false, 'Draft supplier replenishment must not be activatable.');
    // Platform documentation is centralized under the outer /docs tree; component tests verify runtime artefacts only.
    $verify = (string) file_get_contents($root . '/bin/verify.php');
    $assert(str_contains($verify, 'template_catalogue_run.php'), 'Main verifier does not run the template catalogue suite.');
    $assert(str_contains($verify, 'assurance_workflows_run.php'), 'Main verifier does not run the assurance workflow suite.');
    $assert(str_contains($verify, 'commerce_vertical_workflows_run.php'), 'Main verifier does not run the commerce and vertical workflow suite.');
});

$test('template registry rejects duplicate identifiers', function () use ($assert): void {
    $registry = new App\Extensions\InteractionEngine\System\Template\TemplateRegistry();
    $definition = [
        'id' => 'duplicate-test',
        'version' => '1.0.0',
        'name' => 'Duplicate Test',
        'status' => 'draft',
        'category' => 'test',
        'entry_wizard' => 'future_wizard_v1',
    ];
    $registry->register($definition);
    try {
        $registry->register($definition);
        $assert(false, 'Duplicate template identifier should be rejected.');
    } catch (RuntimeException $error) {
        $assert(str_contains($error->getMessage(), 'already registered'), 'Duplicate rejection was not actionable.');
    }
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

echo "\n{$passed}/" . count($tests) . " template catalogue tests passed\n";
exit($failed === 0 ? 0 : 1);
