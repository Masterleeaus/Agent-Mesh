<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void {
    if (!$condition) {
        $failures[] = $message;
    }
};

$check(!is_file($root . '/System/AI/OpenAIService.php'), 'OpenAIService.php must be removed.');
$config = (string) file_get_contents($root . '/config/interaction.php');
foreach (['INTERACTION_AI_ENABLED', 'INTERACTION_AI_PROVIDER', 'INTERACTION_AI_API_KEY', 'INTERACTION_AI_MODEL'] as $key) {
    $check(!str_contains($config, $key), "Cloud AI config key remains: {$key}");
}
$provider = (string) file_get_contents($root . '/System/InteractionEngineServiceProvider.php');
$check(!str_contains($provider, '\\OpenAI::factory'), 'Service provider still creates an OpenAI client.');
$devComposer = $root . '/development/composer.json';
$check(!is_file($devComposer) || !str_contains((string) file_get_contents($devComposer), 'openai-php/client'), 'Development Composer metadata still suggests cloud AI client.');
$check(is_file($root . '/bin/localbrain.php'), 'LocalBrain CLI bridge is missing.');

if ($failures !== []) {
    foreach ($failures as $failure) {
        echo "FAIL {$failure}\n";
    }
    exit(1);
}

echo "PASS offline-only policy\n";
