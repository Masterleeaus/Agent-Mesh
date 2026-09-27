<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require_once $root.'/System/Contracts/TitanAppsInterfaceContributionContract.php';
require_once $root.'/System/Surfaces/SurfaceWizardPolicy.php';
require_once $root.'/System/InterfaceContributions/SurfaceProjectionRegistry.php';
require_once $root.'/System/InterfaceContributions/SemanticInterfaceContributionGateway.php';

use App\Extensions\InteractionEngine\System\InterfaceContributions\SemanticInterfaceContributionGateway;
use App\Extensions\InteractionEngine\System\InterfaceContributions\SurfaceProjectionRegistry;
use App\Extensions\InteractionEngine\System\Surfaces\SurfaceWizardPolicy;

$fail = static function (string $message): never { fwrite(STDERR, "FAIL: {$message}\n"); exit(1); };
$gateway = new SemanticInterfaceContributionGateway(new SurfaceWizardPolicy(), new SurfaceProjectionRegistry());

$structured = [
    'company_id' => 42,
    'presentation_intent' => ['surface' => 'command', 'purpose' => 'review'],
    'capability_result' => [
        'capability' => 'crm.quote.prepare',
        'status' => 'proposal_submitted',
        'data' => [
            'summary' => 'Quote ready for review',
            'workforce_plan' => ['steps' => [['id' => 's1']]],
            'internal_notes' => 'never present this',
            'raw_provider_payload' => ['secret' => 'x'],
            'tenant_id' => 999,
            'company_id' => 999,
        ],
        'authoritative_business_execution' => false,
    ],
    'recommended_actions' => [[
        'capability' => 'crm.quote.approve',
        'parameters' => ['quote_id' => 9, 'tenant_id' => 42, 'company_id' => 42],
    ]],
];

$out = $gateway->normalize($structured, ['company_id' => 42, 'source' => 'workforce']);
if (($out['surface'] ?? null) !== 'zero') $fail('command alias must resolve to zero');
if (($out['projection']['projection_id'] ?? null) !== 'workforce.zero.v1') $fail('zero projection was not selected');
$data = (array)($out['capability_result']['data'] ?? []);
if (($data['summary'] ?? null) !== 'Quote ready for review') $fail('registered summary field missing');
if (! isset($data['workforce_plan'])) $fail('registered zero workforce_plan missing');
foreach (['internal_notes','raw_provider_payload','tenant_id','tenant_company_id','company_id'] as $forbidden) {
    if (array_key_exists($forbidden, $data)) $fail("unregistered/raw field leaked: {$forbidden}");
}
$params = (array)($out['actions'][0]['parameters'] ?? []);
if (array_key_exists('tenant_id', $params) || array_key_exists('tenant_company_id', $params)) $fail('legacy tenant identifier leaked into presented action parameters');
if (($params['company_id'] ?? null) !== '42') $fail('presented action company_id must be canonical trusted company_id');

$hub = $structured;
$hub['presentation_intent']['surface'] = 'customer';
$hubOut = $gateway->normalize($hub, ['company_id' => 42, 'source' => 'workforce']);
if (($hubOut['surface'] ?? null) !== 'hub') $fail('customer alias must resolve to hub');
$hubData = (array)($hubOut['capability_result']['data'] ?? []);
if (isset($hubData['workforce_plan'])) $fail('hub projection leaked internal workforce plan');
if (($hubData['summary'] ?? null) !== 'Quote ready for review') $fail('hub safe summary missing');

$unknown = $structured;
$unknownOut = $gateway->normalize($unknown, ['company_id' => 42, 'source' => 'unknown-provider']);
if (($unknownOut['capability_result']['data'] ?? ['unexpected']) !== []) $fail('unregistered provider projection must default deny');

$conflict = false;
try {
    $bad = $structured;
    $bad['recommended_actions'][0]['parameters']['company_id'] = 99;
    $gateway->normalize($bad, ['company_id' => 42, 'source' => 'workforce']);
} catch (InvalidArgumentException) { $conflict = true; }
if (! $conflict) $fail('conflicting action parameter company_id did not fail closed');

echo "PASS: projection + company security boundary\n";
