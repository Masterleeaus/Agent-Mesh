<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require_once $root.'/System/Contracts/TitanAppsInterfaceContributionContract.php';
require_once $root.'/System/Surfaces/SurfaceWizardPolicy.php';
require_once $root.'/System/InterfaceContributions/SurfaceProjectionRegistry.php';
require_once $root.'/System/InterfaceContributions/SemanticInterfaceContributionGateway.php';

use App\Extensions\InteractionEngine\System\InterfaceContributions\SemanticInterfaceContributionGateway;
use App\Extensions\InteractionEngine\System\Surfaces\SurfaceWizardPolicy;

$fail = static function (string $message): never { fwrite(STDERR, "FAIL: {$message}\n"); exit(1); };
$gateway = new SemanticInterfaceContributionGateway(new SurfaceWizardPolicy());
$out = $gateway->normalize([
    'company_id' => 42,
    'presentation_intent' => ['surface' => 'command', 'journey' => 'onboarding', 'purpose' => 'review'],
    'recommended_components' => ['workforce.plan.review', '<script>alert(1)</script>', ['component_id' => 'crm.quote.summary']],
    'recommended_actions' => [[
        'action_id' => 'approve-1', 'label' => 'Approve quote', 'capability' => 'crm.quote.approve', 'parameters' => ['quote_id' => 9],
    ]],
    'confidence' => 0.8,
], ['company_id' => 42, 'tenant_company_id' => 42]);

if (($out['surface'] ?? null) !== 'zero') $fail('command alias did not canonicalize to zero');
if (($out['journey'] ?? null) !== 'onboarding') $fail('journey was not preserved');
if (($out['company_id'] ?? null) !== '42') $fail('company_id missing');
if (count($out['components'] ?? []) !== 2) $fail('invalid executable-looking component ID was not dropped');
if (($out['ownership']['composition_and_rendering'] ?? null) !== 'titan_apps_interface_runtime') $fail('Interface Runtime ownership missing');
if (($out['ownership']['editing_and_publishing'] ?? null) !== 'titan_apps_builder') $fail('Builder ownership missing');
if (($out['safety']['arbitrary_executable_ui_allowed'] ?? true) !== false) $fail('executable UI must be forbidden');
if (($out['safety']['execution_authority_granted'] ?? true) !== false) $fail('contribution must grant no authority');

$conflict = false;
try {
    $gateway->normalize(['company_id' => 42], ['company_id' => 42, 'tenant_id' => 99]);
} catch (InvalidArgumentException) { $conflict = true; }
if (! $conflict) $fail('legacy tenant conflict did not fail closed');

$missing = false;
try { $gateway->normalize([], []); } catch (InvalidArgumentException) { $missing = true; }
if (! $missing) $fail('missing company_id did not fail closed');

echo "PASS: Interface Runtime + Builder contribution boundary\n";
