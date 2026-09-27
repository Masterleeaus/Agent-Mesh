<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/LocalIntelligence/Language/NaiveBayesIntentClassifier.php';

use App\Extensions\InteractionEngine\System\LocalIntelligence\Language\NaiveBayesIntentClassifier;

$classifier = NaiveBayesIntentClassifier::default();
$inputs = [
    'Prepare a quote for carpet cleaning',
    'Remind me to call the customer tomorrow',
    'I feel overwhelmed and need support',
    'Schedule the job for Friday',
    'The sky is blue',
];

for ($iteration = 0; $iteration < 100; $iteration++) {
    foreach ($inputs as $input) {
        $classifier->predict($input);
    }
}

$predictions = 10_000;
$started = hrtime(true);
for ($index = 0; $index < $predictions; $index++) {
    $classifier->predict($inputs[$index % count($inputs)]);
}
$totalMs = (hrtime(true) - $started) / 1_000_000;

echo json_encode([
    'runtime' => PHP_VERSION,
    'predictions' => $predictions,
    'total_ms' => round($totalMs, 3),
    'mean_ms' => round($totalMs / $predictions, 6),
    'estimated_model_bytes' => $classifier->estimatedModelBytes(),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), PHP_EOL;
