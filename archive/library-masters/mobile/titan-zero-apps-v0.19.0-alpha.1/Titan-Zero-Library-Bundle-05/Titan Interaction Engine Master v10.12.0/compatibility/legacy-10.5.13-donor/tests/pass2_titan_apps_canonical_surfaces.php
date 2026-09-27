<?php

declare(strict_types=1);

require_once dirname(__DIR__).'/System/Surfaces/SurfaceWizardPolicy.php';
require_once dirname(__DIR__).'/System/Journey/JourneyDefinition.php';
require_once dirname(__DIR__).'/System/Journey/JourneyRegistry.php';

use App\Extensions\InteractionEngine\System\Surfaces\SurfaceWizardPolicy;
use App\Extensions\InteractionEngine\System\Journey\JourneyRegistry;

$failures = 0;
$check = static function (bool $condition, string $message) use (&$failures): void {
    echo ($condition ? 'PASS ' : 'FAIL ').$message."\n";
    if (!$condition) $failures++;
};

$policy = new SurfaceWizardPolicy();
foreach (['zero','bos','command','owner','manager','business','titan_command','titan-command'] as $alias) {
    $check($policy->canonicalSurface($alias) === 'zero', "{$alias} resolves to zero");
}
foreach (['go','field','worker','titan_go','titan-go'] as $alias) {
    $check($policy->canonicalSurface($alias) === 'go', "{$alias} resolves to go");
}
foreach (['hub','customer','titan_hub','titan-hub'] as $alias) {
    $check($policy->canonicalSurface($alias) === 'hub', "{$alias} resolves to hub");
}
foreach (['onboarding','setup','titan_onboarding','titan-onboarding'] as $alias) {
    $check($policy->canonicalSurface($alias) === 'zero', "{$alias} surface resolves to zero");
    $check($policy->canonicalJourney($alias) === 'onboarding', "{$alias} preserves onboarding journey");
}
$check($policy->canonicalJourney('zero') === null, 'zero without onboarding alias has no implicit journey');
$check($policy->allows('onboarding','field_home_services_onboarding_v1'), 'legacy onboarding alias can access onboarding wizard through zero policy');
$check($policy->allows('command','create_job_v1'), 'legacy command alias can access zero wizard policy');
$check($policy->allows('zero','field_home_services_onboarding_v1'), 'zero owns onboarding wizard');

$registry = new JourneyRegistry();
$businessOnboarding = $registry->get('business_initial_onboarding');
$check($businessOnboarding->surfaces === ['zero'], 'business onboarding is registered only on canonical zero surface');
$check(($businessOnboarding->metadata['journey'] ?? null) === 'onboarding', 'business onboarding carries onboarding journey metadata');
$check(count($registry->forSurface('zero')) >= 4, 'zero receives command-era and onboarding journeys');
$check($registry->forSurface('command') === [], 'journey registry stores no command canonical surface');
$check($registry->forSurface('onboarding') === [], 'journey registry stores no onboarding canonical surface');

$manifest = json_decode((string) file_get_contents(dirname(__DIR__).'/extension.manifest.json'), true);
$caps = $manifest['capabilities'] ?? [];
$check(in_array('interaction.surface.zero', $caps, true), 'manifest advertises canonical zero surface');
$check(!in_array('interaction.surface.command', $caps, true), 'manifest no longer advertises command as canonical surface');
$check(!in_array('interaction.surface.onboarding', $caps, true), 'manifest no longer advertises onboarding as canonical surface');
$check(in_array('interaction.journey.onboarding', $caps, true), 'manifest advertises onboarding as journey capability');

exit($failures === 0 ? 0 : 1);
