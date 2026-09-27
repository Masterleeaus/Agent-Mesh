<?php

declare(strict_types=1);

$provider = file_get_contents(__DIR__.'/../System/TitanGoServiceProvider.php');
$bootstrap = file_get_contents(__DIR__.'/../System/Runtime/GoBootstrap.php');
$manifest = json_decode(file_get_contents(__DIR__.'/../extension.json'), true, 512, JSON_THROW_ON_ERROR);

assert(str_contains($provider, "return 'titan-go';"));
assert(str_contains($provider, 'public static function uninstall(): void'));
assert(str_contains($provider, 'GoBootstrap::class'));
assert(str_contains($bootstrap, "'business_truth' => 'provider'"));
assert(str_contains($bootstrap, "'raw_domain_records' => false"));
assert(($manifest['slug'] ?? '') === 'titan-go');

echo "go_pass3_lifecycle_bootstrap: PASS\n";
