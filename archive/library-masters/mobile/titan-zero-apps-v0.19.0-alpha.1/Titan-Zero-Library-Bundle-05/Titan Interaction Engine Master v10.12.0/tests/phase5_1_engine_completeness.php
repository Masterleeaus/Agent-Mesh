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

$test('business builder produces field-services blueprints instead of placeholder services', function () use ($assert): void {
    $engine = new App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\BusinessBuilderEngine();
    $blueprint = $engine->generate('cleaning');
    $assert(($blueprint['profile'] ?? null) === 'field_home_services', 'Blueprint must identify field/home-services profile.');
    $assert(in_array('standard_clean', $blueprint['services'] ?? [], true), 'Cleaning blueprint must include concrete service identifiers.');
    $assert(!in_array('Service A', $blueprint['services'] ?? [], true), 'Placeholder services must not remain.');
    try {
        $engine->generate('ecommerce');
        $assert(false, 'Non-field verticals must be rejected by the production business builder.');
    } catch (InvalidArgumentException) {
        $assert(true);
    }
});

$test('automation engine creates addressable automations and trigger changes observable state', function () use ($assert): void {
    $engine = new App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\AutomationEngine();
    $engine->automate('send_job_reminder', ['minutes_before' => 60]);
    $items = $engine->getAutomations();
    $assert(isset($items[0]['id']) && ($items[0]['status'] ?? null) === 'scheduled', 'Automation must have id and scheduled state.');
    $engine->trigger((string) $items[0]['id']);
    $triggered = $engine->getAutomations()[0] ?? [];
    $assert(($triggered['status'] ?? null) === 'triggered', 'Trigger must update automation status.');
    $assert(isset($triggered['triggered_at']), 'Trigger must record time.');
});

$test('learning engine retrain updates versioned learned state', function () use ($assert): void {
    $engine = new App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\LearningEngine();
    $engine->learn([['intent' => 'book_job']], 'intent');
    $before = $engine->getLearnedModels()['intent'] ?? [];
    $assert(($before['version'] ?? null) === 1, 'Initial learned model must be versioned.');
    $engine->retrain('intent');
    $after = $engine->getLearnedModels()['intent'] ?? [];
    $assert(($after['version'] ?? null) === 2, 'Retrain must advance model version.');
    $assert(isset($after['retrained_at']), 'Retrain must be observable.');
});

$test('retry engine records deterministic retry schedule instead of no-op', function () use ($assert): void {
    $engine = new App\Extensions\InteractionEngine\System\Engines\Planning\Implementations\RetryEngine();
    $engine->retryWithBackoff('job-sync-1');
    $policy = $engine->getRetryPolicy();
    $assert(($policy['last_retry']['task_id'] ?? null) === 'job-sync-1', 'Retry must record task id.');
    $assert(($policy['last_retry']['attempt'] ?? null) === 1, 'Retry must record first attempt.');
    $assert(($policy['last_retry']['delay_seconds'] ?? null) === 1, 'First exponential delay must use base delay.');
});

$test('execution engine fails closed for unknown work and runs only registered executors', function () use ($assert): void {
    $engine = new App\Extensions\InteractionEngine\System\Engines\Planning\Implementations\ExecutionEngine();
    $unknown = $engine->execute('unknown', []);
    $assert(($unknown['status'] ?? null) === 'unavailable', 'Unknown execution must not report success.');
    $engine->registerExecutor('calculate_duration', static fn(array $p): array => ['minutes' => (int) $p['rooms'] * 30]);
    $result = $engine->execute('calculate_duration', ['rooms' => 3]);
    $assert(($result['status'] ?? null) === 'success' && ($result['result']['minutes'] ?? null) === 90, 'Registered deterministic executor must run.');
});

$test('dialogue engine produces input-aware local responses and tracks turns', function () use ($assert): void {
    $engine = new App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations\DialogueEngine();
    $booking = $engine->process('I need to book a clean tomorrow');
    $assert(str_contains(strtolower($booking), 'book'), 'Booking dialogue must respond to booking intent.');
    $question = $engine->process('What services do you offer?');
    $assert($question !== $booking, 'Dialogue must not return one fixed sentence for every input.');
    $assert(($engine->getState()['turn_count'] ?? 0) === 2, 'Dialogue state must track turns.');
});

$test('financial insight engine never fabricates finance figures without a provider', function () use ($assert): void {
    $engine = new App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\FinancialInsightEngine();
    try {
        $engine->getRevenueForecast();
        $assert(false, 'Finance engine must fail closed without an authoritative provider.');
    } catch (LogicException) {
        $assert(true);
    }
    $provider = new class implements App\Extensions\InteractionEngine\System\Contracts\FinancialMetricsProviderInterface {
        public function revenueForecast(): float { return 1234.5; }
        public function cashFlow(): array { return ['in' => 2000.0, 'out' => 765.5, 'net' => 1234.5]; }
        public function profitabilityMetrics(): array { return ['gross_margin' => 0.4, 'net_margin' => 0.2]; }
    };
    $wired = new App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\FinancialInsightEngine($provider);
    $assert($wired->getRevenueForecast() === 1234.5, 'Finance engine must delegate to authoritative provider.');
});

$test('monitoring engine reports runtime-derived metrics instead of fixed demo values', function () use ($assert): void {
    $engine = new App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\MonitoringEngine();
    $metrics = $engine->getMetrics();
    $assert(($metrics['source'] ?? null) === 'php_runtime', 'Monitoring metrics must identify runtime source.');
    $assert(isset($metrics['memory_bytes'], $metrics['memory_peak_bytes']), 'Monitoring must expose real PHP memory metrics.');
    $assert(!isset($metrics['cpu']) || $metrics['cpu'] !== 30, 'Fixed demo CPU metric must be removed.');
});

$test('memory consolidation methods are implemented and remain company scoped', function () use ($root, $assert): void {
    foreach (['EpisodicMemoryEngine.php' => 'interaction_episodic_memory', 'SemanticMemoryEngine.php' => 'interaction_semantic_memory'] as $file => $table) {
        $source = (string) file_get_contents($root . '/System/Engines/Memory/Implementations/' . $file);
        $method = strstr($source, 'public function consolidate(): void');
        $assert($method !== false && !str_starts_with($method, "public function consolidate(): void\n    {\n    }"), "{$file} consolidate must not be empty.");
        $assert(str_contains($method, "where('company_id', \$this->tenantContext->companyId())"), "{$file} consolidation must be company scoped.");
        $assert(str_contains($method, $table), "{$file} consolidation must operate on its owned table.");
    }
});

$test('dead multi-vertical command paths and fake CRM handler are removed from production source', function () use ($root, $assert): void {
    foreach ([
        '/System/Wizard/Command/GeneralizedCommandMapper.php',
        '/System/Command/GeneralizedCommandBus.php',
        '/System/Capabilities/CrmCustomerCreateHandler.php',
        '/System/Domain/Vertical/VerticalRegistry.php',
        '/System/Domain/Vertical/VerticalAdapterInterface.php',
        '/System/Domain/Vertical/VerticalSchemaInterface.php',
    ] as $relative) {
        $assert(!is_file($root . $relative), 'Dormant unsafe production path still ships: ' . $relative);
    }
});

$failures = 0;
foreach ($tests as $name => $fn) {
    try { $fn(); echo "PASS {$name}\n"; }
    catch (Throwable $e) { $failures++; echo "FAIL {$name}: {$e->getMessage()}\n"; }
}

echo "\n" . (count($tests) - $failures) . '/' . count($tests) . " Phase 5.1 engine completeness tests passed\n";
exit($failures === 0 ? 0 : 1);
