<?php

declare(strict_types=1);

$moduleRoot = dirname(__DIR__);

spl_autoload_register(static function (string $class) use ($moduleRoot): void {
    $prefix = 'Modules\\TitanZeroAssurance\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $path = $moduleRoot . '/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($path)) {
        require_once $path;
    }
});

use Modules\TitanZeroAssurance\Services\AuthorityPolicy;
use Modules\TitanZeroAssurance\Services\CapabilityRegistry;
use Modules\TitanZeroAssurance\Services\ExecutionContextStore;
use Modules\TitanZeroAssurance\Services\GovernedWorkItemRouter;
use Modules\TitanZeroAssurance\Contracts\WorkItemDispatcher;
use Modules\TitanZeroAssurance\ValueObjects\AssuranceFinding;
use Modules\TitanZeroAssurance\ValueObjects\AuditEvent;
use Modules\TitanZeroAssurance\ValueObjects\CapabilityDefinition;
use Modules\TitanZeroAssurance\ValueObjects\CompanyExecutionContext;
use Modules\TitanZeroAssurance\ValueObjects\EvidenceRef;
use Modules\TitanZeroAssurance\ValueObjects\SignalEnvelope;
use Modules\TitanZeroAssurance\ValueObjects\WorkItemRequest;

$tests = [];

function test(string $name, callable $callback): void
{
    global $tests;
    $tests[$name] = $callback;
}

function assertSameValue(mixed $expected, mixed $actual, string $message = ''): void
{
    if ($expected !== $actual) {
        throw new RuntimeException($message ?: 'Expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
    }
}

function assertTrueValue(bool $actual, string $message = ''): void
{
    if (!$actual) {
        throw new RuntimeException($message ?: 'Expected true.');
    }
}

function assertThrows(callable $callback, string $exceptionClass, string $messageContains = ''): void
{
    try {
        $callback();
    } catch (Throwable $e) {
        if (!$e instanceof $exceptionClass) {
            throw new RuntimeException('Expected ' . $exceptionClass . ', got ' . $e::class . ': ' . $e->getMessage());
        }
        if ($messageContains !== '' && !str_contains($e->getMessage(), $messageContains)) {
            throw new RuntimeException('Exception message did not contain: ' . $messageContains);
        }
        return;
    }

    throw new RuntimeException('Expected exception ' . $exceptionClass . ' was not thrown.');
}

test('company execution context validates and serializes canonical company boundary', function (): void {
    assertThrows(fn () => new CompanyExecutionContext(0, 'human', '42'), InvalidArgumentException::class, 'company_id');

    $context = new CompanyExecutionContext(
        companyId: 17,
        actorType: 'workforce_agent',
        actorId: 'quality-manager-1',
        correlationId: 'corr-123',
        causationId: 'cause-456',
        idempotencyKey: 'idem-789',
        metadata: ['source' => 'test'],
    );

    assertSameValue(17, $context->companyId);
    assertSameValue('workforce_agent', $context->actorType);
    assertSameValue(17, $context->toArray()['company_id']);
    assertTrueValue(!array_key_exists('tenant_company_id', $context->toArray()));
});

test('execution context store requires explicit context and restores nested context', function (): void {
    $store = new ExecutionContextStore();
    assertThrows(fn () => $store->require(), LogicException::class, 'company execution context');

    $outer = new CompanyExecutionContext(17, 'system', 'outer');
    $inner = new CompanyExecutionContext(23, 'system', 'inner');
    $store->set($outer);

    $seen = $store->runWith($inner, function () use ($store): int {
        return $store->require()->companyId;
    });

    assertSameValue(23, $seen);
    assertSameValue(17, $store->require()->companyId);
});

test('signal envelope carries canonical governance and evidence metadata', function (): void {
    $context = new CompanyExecutionContext(17, 'workforce_agent', 'inspector-1', 'corr-1', 'cause-1', 'idem-1');
    $evidence = new EvidenceRef(17, 'photo', 'evidence-1', 'sha256:abc', 'titan://evidence/1');
    $signal = SignalEnvelope::fromContext(
        context: $context,
        signal: 'quality.finding.created',
        subjectType: 'job',
        subjectId: 'job-99',
        evidence: [$evidence],
        metadata: ['severity' => 'high'],
    );

    $data = $signal->toArray();
    assertSameValue(17, $data['company_id']);
    assertSameValue('corr-1', $data['correlation_id']);
    assertSameValue('evidence-1', $data['evidence'][0]['evidence_id']);
    assertThrows(fn () => SignalEnvelope::fromContext($context, 'quality.test', 'job', '1', [new EvidenceRef(99, 'photo', 'x')]), InvalidArgumentException::class, 'company');
});

test('finding and work item stay company bound', function (): void {
    $finding = new AssuranceFinding(
        findingId: 'finding-1',
        companyId: 17,
        domain: 'quality',
        severity: 'high',
        title: 'Failed final inspection',
        subjectType: 'job',
        subjectId: 'job-99',
        evidence: [new EvidenceRef(17, 'photo', 'evidence-1')],
    );

    $work = WorkItemRequest::fromFinding(
        finding: $finding,
        workType: 'corrective_action',
        action: 'schedule_reclean',
        risk: 'medium',
        requiredCapabilities: ['quality.corrective.schedule'],
    );

    assertSameValue(17, $work->companyId);
    assertSameValue('finding-1', $work->sourceFindingId);
    assertThrows(fn () => new AssuranceFinding('x', 17, 'quality', 'extreme', 'Bad', 'job', '1'), InvalidArgumentException::class, 'severity');
});

test('authority policy blocks missing capabilities and requires approval above low risk', function (): void {
    $policy = new AuthorityPolicy();

    $blocked = $policy->evaluate('low', ['quality.corrective.schedule'], []);
    assertSameValue('blocked', $blocked->status);

    $approval = $policy->evaluate('medium', ['quality.corrective.schedule'], ['quality.corrective.schedule']);
    assertSameValue('approval_required', $approval->status);

    $allowed = $policy->evaluate('low', ['quality.inspect.read'], ['quality.inspect.read']);
    assertSameValue('allowed', $allowed->status);
});

test('capability registry normalizes definitions and rejects conflicting duplicates', function (): void {
    $registry = new CapabilityRegistry();
    $capability = new CapabilityDefinition(
        key: 'quality.inspect.read',
        label: 'Read quality inspections',
        risk: 'low',
        handler: 'quality.inspect.read',
        requiredPermissions: ['view_quality_control'],
    );

    $registry->register('QualityControl', $capability);
    $registry->register('QualityControl', $capability);
    assertSameValue('QualityControl', $registry->get('quality.inspect.read')['module']);

    assertThrows(function () use ($registry): void {
        $registry->register('OtherModule', new CapabilityDefinition('quality.inspect.read', 'Different', 'low', 'other'));
    }, LogicException::class, 'already registered');
});

test('governed work item router never dispatches blocked or approval-required work', function (): void {
    $dispatcher = new class implements WorkItemDispatcher {
        public array $dispatched = [];
        public function dispatch(WorkItemRequest $request): string
        {
            $this->dispatched[] = $request;
            return 'work-1';
        }
    };

    $router = new GovernedWorkItemRouter(new AuthorityPolicy(), $dispatcher);
    $request = new WorkItemRequest('req-1', 17, 'corrective_action', 'schedule_reclean', 'medium', ['quality.corrective.schedule']);

    $blocked = $router->route($request, []);
    assertSameValue('blocked', $blocked['decision']->status);
    assertSameValue(null, $blocked['work_item_id']);
    assertSameValue(0, count($dispatcher->dispatched));

    $result = $router->route($request, ['quality.corrective.schedule']);
    assertSameValue('approval_required', $result['decision']->status);
    assertSameValue(null, $result['work_item_id']);
    assertSameValue(0, count($dispatcher->dispatched));

    $lowRisk = new WorkItemRequest('req-2', 17, 'inspection_read', 'quality.inspect.read', 'low', ['quality.inspect.read']);
    $allowed = $router->route($lowRisk, ['quality.inspect.read']);
    assertSameValue('allowed', $allowed['decision']->status);
    assertSameValue('work-1', $allowed['work_item_id']);
    assertSameValue(1, count($dispatcher->dispatched));
});

test('audit event is company scoped and retains evidence references', function (): void {
    $context = new CompanyExecutionContext(17, 'workforce_agent', 'quality-manager-1', 'corr-1');
    $audit = AuditEvent::fromContext(
        context: $context,
        action: 'quality.corrective.schedule',
        outcome: 'approval_required',
        subjectType: 'finding',
        subjectId: 'finding-1',
        evidence: [new EvidenceRef(17, 'inspection_record', 'record-1')],
        metadata: ['risk' => 'medium'],
    );

    assertSameValue(17, $audit->toArray()['company_id']);
    assertSameValue('record-1', $audit->toArray()['evidence'][0]['evidence_id']);
});

test('module metadata and QualityControl bridge enforce pass 1 invariants', function () use ($moduleRoot): void {
    $module = json_decode((string) file_get_contents($moduleRoot . '/module.json'), true, 512, JSON_THROW_ON_ERROR);
    assertSameValue('TitanZeroAssurance', $module['name']);
    assertTrueValue(in_array('Modules\\TitanZeroAssurance\\Providers\\TitanZeroAssuranceServiceProvider', $module['providers'], true));

    $base = dirname($moduleRoot);
    $trait = (string) file_get_contents($base . '/QualityControl/Traits/CompanyScoped.php');
    assertTrueValue(str_contains($trait, 'TitanZeroAssurance\\Services\\ExecutionContextStore'));
    assertTrueValue(str_contains($trait, "whereRaw('1 = 0')"));
    assertTrueValue(!str_contains($trait, 'fail-open'));
});

$failed = 0;
foreach ($tests as $name => $callback) {
    try {
        $callback();
        echo "PASS: {$name}\n";
    } catch (Throwable $e) {
        $failed++;
        fwrite(STDERR, "FAIL: {$name}\n  {$e->getMessage()}\n");
    }
}

echo sprintf("\nTitanZeroAssurance tests: %d passed, %d failed\n", count($tests) - $failed, $failed);
exit($failed === 0 ? 0 : 1);
