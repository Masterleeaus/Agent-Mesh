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

$test('adaptive persona tracker detects sentiment and formality drift after a rolling baseline', function () use ($assert): void {
    $tracker = new App\Extensions\InteractionEngine\System\LocalIntelligence\Persona\BehavioralDriftTracker(windowSize: 3, driftThreshold: 0.20);
    $user = 'user-1';
    $baseline = [
        'I am pleased with the completed service and appreciate the detailed report.',
        'I am happy with the professional result and the clear documentation.',
        'The work is excellent and I am satisfied with the formal summary.',
    ];
    foreach ($baseline as $index => $text) {
        $tracker->observe($user, $text, new DateTimeImmutable("2026-08-0" . ($index + 1) . "T09:00:00+10:00"), "baseline-{$index}");
    }

    $drift = $tracker->observe(
        $user,
        "I'm angry, this is awful and I hate it! Fix it now!",
        new DateTimeImmutable('2026-08-04T09:00:00+10:00'),
        'drift-1',
    );

    $assert($drift['drift_event'] === true, 'Expected a drift event after a stable three-observation baseline.');
    $assert($drift['metrics']['sentiment_polarity'] < -0.2, 'Expected negative sentiment polarity.');
    $assert($drift['metrics']['formality'] < $drift['baseline']['formality'], 'Expected formality to fall below baseline.');
    $assert($drift['triggers'] !== [], 'Expected trigger phrases for a drift event.');
});

$test('offline multinomial naive bayes recognises business and conversational intents', function () use ($assert): void {
    $classifier = App\Extensions\InteractionEngine\System\LocalIntelligence\Language\NaiveBayesIntentClassifier::default();

    $quote = $classifier->predict('Please prepare a quote for the carpet cleaning job.');
    $reminder = $classifier->predict('Remind me to call the customer tomorrow morning.');
    $support = $classifier->predict('I feel overwhelmed and need someone to talk to.');

    $assert($quote['intent'] === 'create_quote', 'Expected create_quote intent.');
    $assert($reminder['intent'] === 'reminder', 'Expected reminder intent.');
    $assert($support['intent'] === 'emotional_support', 'Expected emotional_support intent.');
    $assert($quote['confidence'] > 0.5, 'Expected a meaningful classifier confidence.');
});

$test('LocalBrain recognises school ERP read-only intents without cloud inference', function () use ($assert): void {
    $brain = App\Extensions\InteractionEngine\System\LocalIntelligence\LocalBrain::createDefault();
    $cases = [
        'Show my attendance for this month' => 'attendance_query',
        'What marks did I get in mathematics?' => 'marks_query',
        'Are any school fees still pending?' => 'fees_query',
        'Show my pending homework' => 'homework_query',
        'What classes do I have tomorrow?' => 'timetable_query',
        'Summarise my academic performance' => 'performance_analysis',
        'Build a study plan for my exams' => 'study_plan',
        'Create a progress report for my parent' => 'progress_report',
    ];
    foreach ($cases as $message => $expected) {
        $result = $brain->process($message, ['company_id' => 'school-a', 'user_id' => 'user-a']);
        $assert(($result['perception']['intent'] ?? null) === $expected, "Expected {$expected} for: {$message}");
        $assert(($result['audit']['cloud_used'] ?? true) === false, 'LocalBrain must report zero cloud use.');
    }
});

$test('weighted memory reranker uses semantic recency and emotion while flagging real fact conflicts only', function () use ($assert): void {
    $reranker = new App\Extensions\InteractionEngine\System\LocalIntelligence\Reasoning\WeightedMemoryReranker();
    $result = $reranker->rank([
        [
            'id' => 'old-portland',
            'content' => 'My sister is moving to Portland.',
            'semantic_similarity' => 0.95,
            'timestamp' => '2026-05-01T10:00:00+10:00',
            'emotional_intensity' => 0.30,
            'fact_key' => 'sister_location',
            'fact_value' => 'Portland',
        ],
        [
            'id' => 'new-seattle',
            'content' => 'My sister is now living in Seattle and I am very worried.',
            'semantic_similarity' => 0.92,
            'timestamp' => '2026-08-02T10:00:00+10:00',
            'emotional_intensity' => 0.90,
            'fact_key' => 'sister_location',
            'fact_value' => 'Seattle',
        ],
        [
            'id' => 'unrelated',
            'content' => 'The invoice was paid.',
            'semantic_similarity' => 0.15,
            'timestamp' => '2026-08-03T10:00:00+10:00',
            'emotional_intensity' => 0.10,
            'fact_key' => 'invoice_status',
            'fact_value' => 'paid',
        ],
    ], new DateTimeImmutable('2026-08-03T12:00:00+10:00'));

    $assert(($result['most_relevant']['id'] ?? null) === 'new-seattle', 'Expected the recent, emotionally strong semantic match to rank first.');
    $assert(count($result['contradictions']) === 1, 'Expected exactly one genuine fact contradiction.');
    $assert(($result['contradictions'][0]['id'] ?? null) === 'old-portland', 'Expected Portland to be flagged as the conflicting older fact.');
    $assert(!in_array('unrelated', array_column($result['contradictions'], 'id'), true), 'Unrelated memories must not be labelled contradictions.');
});

$test('vector clocks preserve causal ordering and identify concurrent updates', function () use ($assert): void {
    $phone = new App\Extensions\InteractionEngine\System\LocalIntelligence\Sync\VectorClock(['phone' => 2]);
    $tablet = new App\Extensions\InteractionEngine\System\LocalIntelligence\Sync\VectorClock(['tablet' => 1]);
    $assert($phone->compare($tablet) === 'concurrent', 'Independent device updates should be concurrent.');

    $merged = $phone->merge($tablet)->tick('phone');
    $assert($merged->toArray() === ['phone' => 3, 'tablet' => 1], 'Merged clock values are incorrect.');
    $assert($merged->compare($phone) === 'after', 'Merged and ticked state should happen after the phone state.');
});

$test('causal sync resolver applies LWW only to approved fields and exposes unresolved concurrent conflicts', function () use ($assert): void {
    $resolver = new App\Extensions\InteractionEngine\System\LocalIntelligence\Sync\CausalSyncResolver();
    $result = $resolver->resolve(
        [
            'clock' => ['phone' => 2],
            'updated_at' => '2026-08-03T09:00:00+10:00',
            'payload' => ['mood_label' => 'curious', 'notes' => 'phone note'],
        ],
        [
            'clock' => ['tablet' => 1],
            'updated_at' => '2026-08-03T10:00:00+10:00',
            'payload' => ['mood_label' => 'frustrated', 'notes' => 'tablet note'],
        ],
        ['mood_label'],
    );

    $assert($result['relation'] === 'concurrent', 'Expected concurrent relation.');
    $assert(($result['state']['payload']['mood_label'] ?? null) === 'frustrated', 'Approved LWW field should use the later remote value.');
    $assert(count($result['conflicts']) === 1 && $result['conflicts'][0]['field'] === 'notes', 'Non-LWW concurrent field must remain an explicit conflict.');
    $assert(($result['state']['clock'] ?? []) === ['phone' => 2, 'tablet' => 1], 'Merged vector clock is incorrect.');
});

$test('LocalBrain reports v2 persona state without removing existing decision output', function () use ($assert): void {
    $brain = App\Extensions\InteractionEngine\System\LocalIntelligence\LocalBrain::createDefault();
    $result = $brain->process('Please prepare a quote for Alex tomorrow.', [
        'company_id' => 'tenant-a',
        'user_id' => 'user-1',
        'device_id' => 'phone-1',
        'correlation_id' => 'corr-1',
        'observation_id' => 'obs-1',
        'observed_at' => '2026-08-03T10:00:00+10:00',
    ]);

    $assert(($result['model_version'] ?? null) === 'local-brain-v2', 'LocalBrain did not identify itself as v2.');
    $assert(isset($result['persona']['metrics']['sentiment_polarity']), 'Persona metrics are missing.');
    $assert(($result['perception']['intent'] ?? null) === 'create_quote', 'Existing business intent behavior regressed.');
    $assert(array_key_exists('decision', $result), 'Existing decision output was removed.');
});

$test('conversational intents remain local and cannot become unregistered remote capability commands', function () use ($assert): void {
    $brain = App\Extensions\InteractionEngine\System\LocalIntelligence\LocalBrain::createDefault();
    $result = $brain->process('Remind me to call the customer tomorrow.', [
        'company_id' => 'tenant-a',
        'user_id' => 'user-2',
        'device_id' => 'phone-2',
        'correlation_id' => 'corr-2',
        'observation_id' => 'obs-2',
    ]);
    $assert(($result['perception']['intent'] ?? null) === 'reminder', 'Expected reminder classification.');
    $assert(($result['decision']['action'] ?? null) === null, 'Reminder must not become an unregistered remote capability command.');
    $assert(str_contains((string) ($result['suggestions'][0] ?? ''), 'no remote capability command'), 'Expected explicit local-only guidance.');
});

$passed = 0;
foreach ($tests as $name => $fn) {
    try {
        $fn();
        $passed++;
        echo "PASS {$name}\n";
    } catch (Throwable $error) {
        echo "FAIL {$name}: {$error->getMessage()}\n";
    }
}

echo "\n{$passed}/" . count($tests) . " LocalBrain v2 tests passed\n";
exit($passed === count($tests) ? 0 : 1);
