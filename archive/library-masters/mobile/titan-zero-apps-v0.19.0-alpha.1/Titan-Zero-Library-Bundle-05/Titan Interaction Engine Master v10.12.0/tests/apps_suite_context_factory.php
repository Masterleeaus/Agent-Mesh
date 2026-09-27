<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\InteractionEngine\\';
    if (!str_starts_with($class, $prefix)) return;
    $file = $root.'/'.str_replace('\\', '/', substr($class, strlen($prefix))).'.php';
    if (is_file($file)) require_once $file;
});

$fails = [];
$check = function (bool $condition, string $message) use (&$fails): void {
    echo ($condition ? 'PASS ' : 'FAIL ').$message."\n";
    if (!$condition) $fails[] = $message;
};

$factory = new App\Extensions\InteractionEngine\System\Context\InteractionContextFactory(
    new App\Extensions\InteractionEngine\System\Surfaces\SurfaceWizardPolicy()
);

foreach (['command','bos','owner','manager','business'] as $alias) {
    $context = $factory->make('company-1','actor-1',$alias);
    $check($context->surface === 'zero', $alias.' canonicalizes to zero context');
}
foreach (['field','worker'] as $alias) {
    $check($factory->make('company-1','actor-1',$alias)->surface === 'go', $alias.' canonicalizes to go context');
}
$check($factory->make('company-1','actor-1','customer')->surface === 'hub', 'customer canonicalizes to hub context');
$onboarding = $factory->make('company-1','actor-1','onboarding');
$check($onboarding->surface === 'zero' && $onboarding->journey === 'onboarding', 'legacy onboarding surface becomes zero onboarding journey');
try {
    $factory->make('company-1','actor-1','go','onboarding');
    $check(false, 'onboarding rejected outside Zero');
} catch (InvalidArgumentException) {
    $check(true, 'onboarding rejected outside Zero');
}

$manifest = json_decode((string) file_get_contents($root.'/extension.json'), true);
$check(($manifest['version'] ?? '') === '10.12.0', 'Interaction Engine version advanced to 10.12.0');
$check(in_array('App\\Extensions\\InteractionEngine\\System\\Contracts\\InteractionContextFactoryInterface', $manifest['public_contracts'] ?? [], true), 'context factory public contract declared');

exit($fails ? 1 : 0);
