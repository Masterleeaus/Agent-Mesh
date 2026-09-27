<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$provider = (string) file_get_contents($root . '/System/TitanInterfaceRuntimeServiceProvider.php');
$manager = (string) file_get_contents($root . '/System/Services/TitanInterfaceRuntimeManager.php');
$configText = (string) file_get_contents($root . '/config/titan-interface-runtime.php');
$assert = static function (bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); };

$assert(str_contains($provider, 'ComponentVocabularyContract::class'), 'component vocabulary binding missing');
$assert(str_contains($provider, 'BuilderPresentationAdapter::class'), 'Builder presentation adapter binding missing');
$assert(str_contains($configText, "'builder_adapter' => true"), 'presentation Builder adapter config missing');
$assert(str_contains($manager, "'presentation_model'"), 'presentation health diagnostics missing');
$assert(preg_match("/'plan_pass' => ([0-9]+)/", $manager, $m) === 1 && (int) $m[1] >= 7, 'manager pass version regressed below Pass 7');

echo "PASS7_BINDING_OK\n";
