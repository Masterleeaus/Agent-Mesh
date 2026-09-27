<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$failures = 0;
$check = static function (bool $ok, string $message) use (&$failures): void {
    echo ($ok ? 'PASS ' : 'FAIL ').$message."\n";
    if (!$ok) $failures++;
};

$onboarding = (string) file_get_contents($root.'/System/Onboarding/OnboardingActionExecutor.php');
$company = (string) file_get_contents($root.'/System/Http/Controllers/CompanySettingsController.php');
$presenter = (string) file_get_contents($root.'/System/Presentation/GeneratedUiPresenter.php');

$check(!str_contains($onboarding, "source_surface']??'onboarding'"), 'onboarding executor no longer defaults to onboarding as a surface');
$check(str_contains($onboarding, "'source_surface'=>(string)(\$context['source_surface']??'zero')"), 'onboarding executor defaults to Zero surface');
$check(str_contains($onboarding, "'journey'=>(string)(\$context['journey']??'onboarding')"), 'onboarding executor preserves onboarding as journey metadata');
$check(!str_contains($company, "['source_surface' => 'command']"), 'company settings no longer emits command as active surface');
$check(str_contains($company, "['source_surface' => 'zero']"), 'company settings emits canonical Zero surface');
$check(str_contains($presenter, 'journeyForContext'), 'generated UI presenter preserves legacy onboarding journey semantics while canonicalizing the surface');

exit($failures === 0 ? 0 : 1);
