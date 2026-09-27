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

$makeEngine = static function () use ($root): array {
    $registry = new App\Extensions\InteractionEngine\System\Wizard\WizardRegistry();
    $registry->discover($root . '/resources/wizards');
    $outbox = new App\Extensions\InteractionEngine\System\Wizard\Offline\LocalCommandOutbox('commerce-vertical-test-secret');
    $engine = new App\Extensions\InteractionEngine\System\Wizard\UniversalWizardEngine(
        $registry,
        new App\Extensions\InteractionEngine\System\Wizard\Validation\WizardValidationEngine(),
        new App\Extensions\InteractionEngine\System\Wizard\Guidance\LocalGuidanceProvider(),
        new App\Extensions\InteractionEngine\System\Wizard\Command\CommandMapper(new App\Extensions\InteractionEngine\System\Authority\ApprovalSigner('commerce-vertical-approval-secret')),
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

$context = [
    'company_id' => 'tenant-commerce-1',
    'user_id' => 'user-manager-7',
    'device_id' => 'tablet-store-2',
    'correlation_id' => 'corr-commerce-001',
    'causation_id' => 'order-4102',
    'actor_type' => 'human',
    'roles' => ['manager'],
];

$test('all twenty two new ready templates have executable wizards and matching capabilities', function () use ($root, $assert): void {
    $wizards = new App\Extensions\InteractionEngine\System\Wizard\WizardRegistry();
    $wizards->discover($root . '/resources/wizards');
    $templates = new App\Extensions\InteractionEngine\System\Template\TemplateRegistry();
    $templates->discover($root . '/resources/templates');
    $readyIds = [
        'product-catalogue-item', 'customer-order-capture', 'order-fulfilment', 'inventory-adjustment',
        'stocktake-variance', 'return-request', 'refund-approval', 'order-issue-resolution',
        'service-booking', 'job-variation-approval', 'property-onboarding', 'maintenance-request',
        'property-turnover-handover', 'site-variation', 'materials-request', 'practical-completion-defects',
        'client-intake-consent', 'booking-intake', 'event-function-setup', 'guest-issue-resolution',
        'store-stock-transfer', 'supplier-receiving-discrepancy',
    ];
    foreach ($readyIds as $id) {
        $assert($templates->has($id), "Missing ready template {$id}");
        $template = $templates->get($id);
        $assert($template->status === 'ready', "Template {$id} is not ready");
        $assert($wizards->has($template->entryWizard), "Template {$id} references missing wizard {$template->entryWizard}");
        $assert(in_array($wizards->get($template->entryWizard)->capability, $template->capabilities, true), "Capability mismatch for {$id}");
    }
});

$test('high value refund fails closed without approval and queues after approval', function () use ($makeEngine, $submit, $context, $assert): void {
    [, $outbox, $engine] = $makeEngine();
    $steps = [
        ['order_id' => 'order-4102', 'return_id' => 'return-88', 'customer_id' => 'customer-22'],
        ['refund_amount' => 750.00, 'currency' => 'AUD', 'refund_reason' => 'damaged_goods'],
        ['evidence_attachment_ids' => ['photo-1'], 'payment_reference' => 'pay-778'],
        ['approval_id' => '', 'approved_by' => '', 'approved_at' => '', 'declaration_accepted' => true],
    ];
    $failed = $submit($engine, $engine->start('refund_approval_v1', $context), $steps);
    $assert(!$failed->complete, 'High value refund completed without approval.');
    $assert(isset($failed->errors['_governance']), 'High value refund did not return governance errors.');

    $steps[3] = ['approval_id' => 'approval-7', 'approved_by' => 'manager-2', 'approved_at' => '2026-08-03T03:20:00+10:00', 'declaration_accepted' => true];
    $passed = $submit($engine, $engine->start('refund_approval_v1', $context), $steps);
    $assert($passed->complete, 'Approved refund did not complete.');
    $assert(($passed->command['capability'] ?? null) === 'commerce.refunds.approve', 'Refund capability mismatch.');
    $assert(count($outbox->pending()) === 1, 'Approved refund was not queued exactly once.');
});

$test('negative inventory adjustment requires evidence and approval', function () use ($makeEngine, $submit, $context, $assert): void {
    [, , $engine] = $makeEngine();
    $steps = [
        ['location_id' => 'warehouse-1', 'product_id' => 'sku-100'],
        ['adjustment_type' => 'write_off', 'quantity_delta' => -12, 'reason' => 'water_damage'],
        ['evidence_attachment_ids' => [], 'reference_id' => 'incident-14'],
        ['approval_id' => '', 'approved_by' => '', 'approved_at' => '', 'declaration_accepted' => true],
    ];
    $failed = $submit($engine, $engine->start('inventory_adjustment_v1', $context), $steps);
    $assert(!$failed->complete, 'Write-off completed without evidence and approval.');
    $assert(isset($failed->errors['_governance']), 'Write-off did not fail through governance.');

    $steps[2]['evidence_attachment_ids'] = ['photo-damage-9'];
    $steps[3] = ['approval_id' => 'approval-stock-1', 'approved_by' => 'manager-2', 'approved_at' => '2026-08-03T03:21:00+10:00', 'declaration_accepted' => true];
    $passed = $submit($engine, $engine->start('inventory_adjustment_v1', $context), $steps);
    $assert($passed->complete, 'Governed inventory write-off did not complete.');
    $assert(($passed->command['payload']['_approval']['id'] ?? null) === 'approval-stock-1', 'Approval envelope missing from write-off command.');
});

$test('material stocktake variance requires evidence and approval', function () use ($makeEngine, $submit, $context, $assert): void {
    [, , $engine] = $makeEngine();
    $steps = [
        ['location_id' => 'store-3', 'stocktake_id' => 'stocktake-2026-08'],
        ['counted_items' => 220, 'variance_item_count' => 7, 'variance_value' => 950.00, 'material_variance' => true],
        ['variance_notes' => 'High value tools missing.', 'evidence_attachment_ids' => []],
        ['approval_id' => '', 'approved_by' => '', 'approved_at' => '', 'declaration_accepted' => true],
    ];
    $failed = $submit($engine, $engine->start('stocktake_variance_v1', $context), $steps);
    $assert(!$failed->complete, 'Material stocktake variance completed without evidence and approval.');

    $steps[2]['evidence_attachment_ids'] = ['count-sheet-3'];
    $steps[3] = ['approval_id' => 'approval-stocktake-3', 'approved_by' => 'manager-2', 'approved_at' => '2026-08-03T03:22:00+10:00', 'declaration_accepted' => true];
    $passed = $submit($engine, $engine->start('stocktake_variance_v1', $context), $steps);
    $assert($passed->complete, 'Approved stocktake variance did not complete.');
});

$test('return request preserves tenant device correlation and idempotency lineage', function () use ($makeEngine, $submit, $context, $assert): void {
    [, , $engine] = $makeEngine();
    $result = $submit($engine, $engine->start('return_request_v1', $context), [
        ['order_id' => 'order-4102', 'customer_id' => 'customer-22', 'requested_at' => '2026-08-03T03:23:00+10:00'],
        ['items' => [['sku' => 'sku-100', 'quantity' => 1]], 'reason' => 'damaged_goods', 'resolution_requested' => 'replacement'],
        ['evidence_attachment_ids' => ['photo-2'], 'collection_required' => true, 'declaration_accepted' => true],
    ]);
    $assert($result->complete, 'Return request did not complete.');
    $metadata = (array) ($result->command['metadata'] ?? []);
    $payloadContext = (array) ($result->command['payload']['_context'] ?? []);
    $assert(($metadata['company_id'] ?? null) === $context['company_id'], 'Company lineage was lost.');
    $assert(($metadata['company_id'] ?? null) === $context['company_id'], 'Legacy company scope was lost.');
    $assert(($payloadContext['device_id'] ?? null) === $context['device_id'], 'Device lineage was lost.');
    $assert(($metadata['correlation_id'] ?? null) === $context['correlation_id'], 'Correlation lineage was lost.');
    $assert(is_string($metadata['idempotency_key'] ?? null) && strlen($metadata['idempotency_key']) === 64, 'Idempotency key is missing or malformed.');
});

$test('job variation with material cost impact requires approval', function () use ($makeEngine, $submit, $context, $assert): void {
    [, , $engine] = $makeEngine();
    $steps = [
        ['job_id' => 'job-900', 'customer_id' => 'customer-22', 'variation_summary' => 'Replace damaged subfloor.'],
        ['cost_impact' => 1400.00, 'schedule_impact_days' => 2, 'material_change' => true],
        ['evidence_attachment_ids' => ['photo-floor-1'], 'customer_approval_id' => '', 'approved_by' => '', 'approved_at' => ''],
        ['declaration_accepted' => true],
    ];
    $failed = $submit($engine, $engine->start('job_variation_approval_v1', $context), $steps);
    $assert(!$failed->complete, 'Material variation completed without approval.');
    $steps[2] = ['evidence_attachment_ids' => ['photo-floor-1'], 'customer_approval_id' => 'approval-customer-44', 'approved_by' => 'customer-22', 'approved_at' => '2026-08-03T03:24:00+10:00'];
    $passed = $submit($engine, $engine->start('job_variation_approval_v1', $context), $steps);
    $assert($passed->complete, 'Approved job variation did not complete.');
});

$test('client intake records explicit accepted consent', function () use ($makeEngine, $submit, $context, $assert): void {
    [, , $engine] = $makeEngine();
    $result = $submit($engine, $engine->start('client_intake_consent_v1', $context), [
        ['client_id' => 'client-91', 'full_name' => 'Alex Example', 'date_of_birth' => '1982-04-14'],
        ['service_type' => 'physiotherapy', 'accessibility_needs' => [], 'emergency_contact' => 'Sam Example'],
        ['consent_decision' => 'accepted', 'consent_recorded_at' => '2026-08-03T03:25:00+10:00', 'privacy_notice_version' => '2026.1'],
        ['declaration_accepted' => true],
    ]);
    $assert($result->complete, 'Accepted client consent did not complete.');
    $assert(($result->command['payload']['consent_decision'] ?? null) === 'accepted', 'Consent decision was not preserved.');
});

$test('supplier receiving discrepancy requires evidence owner and due date', function () use ($makeEngine, $submit, $context, $assert): void {
    [, , $engine] = $makeEngine();
    $steps = [
        ['purchase_order_id' => 'po-550', 'supplier_id' => 'supplier-8', 'received_at' => '2026-08-03T03:26:00+10:00'],
        ['received_items' => [['sku' => 'sku-200', 'quantity' => 8]], 'discrepancy_found' => true, 'discrepancy_summary' => 'Two cartons crushed.'],
        ['evidence_attachment_ids' => [], 'resolution_owner_id' => '', 'resolution_due_at' => ''],
        ['declaration_accepted' => true],
    ];
    $failed = $submit($engine, $engine->start('supplier_receiving_discrepancy_v1', $context), $steps);
    $assert(!$failed->complete, 'Supplier discrepancy completed without evidence and ownership.');
    $steps[2] = ['evidence_attachment_ids' => ['photo-cartons-4'], 'resolution_owner_id' => 'buyer-2', 'resolution_due_at' => '2026-08-05T17:00:00+10:00'];
    $passed = $submit($engine, $engine->start('supplier_receiving_discrepancy_v1', $context), $steps);
    $assert($passed->complete, 'Governed supplier discrepancy did not complete.');
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

echo "\n{$passed}/" . count($tests) . " commerce and vertical workflow tests passed\n";
exit($failed === 0 ? 0 : 1);
