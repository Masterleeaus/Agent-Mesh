<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$providerPath = $root . '/System/TitanInterfaceRuntimeServiceProvider.php';
$source = file_get_contents($providerPath);
if ($source === false) {
    fwrite(STDERR, "FAIL: service provider source unavailable\n");
    exit(1);
}

$failures = [];
$check = static function (bool $ok, string $message) use (&$failures): void {
    if (! $ok) $failures[] = $message;
};

$check(
    str_contains($source, '$this->app->singleton(FacetRegistryContract::class'),
    'FacetRegistryContract has no explicit container binding before install-time boot rebuild.'
);

$registerStart = strpos($source, 'public function register(): void');
$bootStart = strpos($source, 'public function boot(): void');
$check($registerStart !== false && $bootStart !== false && $registerStart < $bootStart, 'register()/boot() layout is not detectable.');
if ($registerStart !== false && $bootStart !== false) {
    $register = substr($source, $registerStart, $bootStart - $registerStart);
    $boot = substr($source, $bootStart);
    preg_match_all('/make\(([A-Za-z0-9_]+RegistryContract)::class\)/', $boot, $matches);
    $bootContracts = array_values(array_unique($matches[1] ?? []));
    foreach ($bootContracts as $contract) {
        $check(
            str_contains($register, "{$contract}::class"),
            "{$contract} is resolved during boot() but is not bound during register()."
        );
    }
}

$check(
    str_contains($source, 'new InMemoryFacetRegistry($app->make(ObjectRegistryContract::class))'),
    'Facet registry binding must construct InMemoryFacetRegistry with ObjectRegistryContract explicitly.'
);

if ($failures !== []) {
    foreach ($failures as $failure) fwrite(STDERR, "FAIL: {$failure}\n");
    exit(1);
}

echo "PASS 20H2: install-time provider boot resolves FacetRegistryContract and all boot-time registries from explicit register() bindings\n";
