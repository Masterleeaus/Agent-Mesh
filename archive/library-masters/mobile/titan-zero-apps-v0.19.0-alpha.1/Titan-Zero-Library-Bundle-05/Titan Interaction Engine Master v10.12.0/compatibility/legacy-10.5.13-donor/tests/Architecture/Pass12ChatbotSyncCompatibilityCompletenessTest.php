<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$model = $root . '/System/Models/ChatbotRegisteredDevice.php';
$errors = [];
if (! is_file($model)) {
    $errors[] = 'ChatbotRegisteredDevice model is missing from retained compatibility subsystem';
} else {
    $source = file_get_contents($model) ?: '';
    if (! str_contains($source, "protected \$table='ext_chatbot_registered_devices'")) {
        $errors[] = 'ChatbotRegisteredDevice does not bind the expected compatibility table';
    }
}
if ($errors !== []) {
    fwrite(STDERR, "PASS12 CHATBOT SYNC COMPATIBILITY: FAIL\n - " . implode("\n - ", $errors) . "\n");
    exit(1);
}
echo "PASS12 CHATBOT SYNC COMPATIBILITY: PASS\n";
