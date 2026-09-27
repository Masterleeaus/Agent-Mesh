<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
foreach ([
    'System/Contracts/AiUiGenerator.php','System/Contracts/ActionCatalog.php','System/Contracts/DataSourceCatalog.php','System/Contracts/TitanAiRuntimeGateway.php',
    'System/GenerativeUI/BuilderRegistry.php','System/Migration/LegacyBusinessSpecMigrator.php','System/Registries/ManifestActionCatalog.php','System/Registries/JsonDataSourceCatalog.php',
    'System/GenerativeUI/GenerativeUiSpecNormaliser.php','System/GenerativeUI/GenerativeUiSpecValidator.php','System/AI/TitanAIAiUiGenerator.php',
] as $file) { require_once $root.'/'.$file; }

use App\Extensions\TitanBuilder\System\AI\TitanAIAiUiGenerator;
use App\Extensions\TitanBuilder\System\Contracts\TitanAiRuntimeGateway;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecNormaliser;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator;
use App\Extensions\TitanBuilder\System\Migration\LegacyBusinessSpecMigrator;
use App\Extensions\TitanBuilder\System\Registries\JsonDataSourceCatalog;
use App\Extensions\TitanBuilder\System\Registries\ManifestActionCatalog;

final class FakeTitanAiRuntime implements TitanAiRuntimeGateway
{
    public array $response = [];
    public array $lastContext = [];
    public function proposeBuilderSpec(string $prompt, array $context): array { $this->lastContext = $context; return $this->response; }
}

$registry = new BuilderRegistry($root.'/resources/builder');
$actions = new ManifestActionCatalog($registry);
$dataSources = new JsonDataSourceCatalog($registry);
$migrator = new LegacyBusinessSpecMigrator();
$normaliser = new GenerativeUiSpecNormaliser($registry, $actions, $migrator);
$validator = new GenerativeUiSpecValidator($registry, $normaliser, $actions, $dataSources);
$runtime = new FakeTitanAiRuntime();
$generator = new TitanAIAiUiGenerator($runtime, $normaliser, $validator, $dataSources);

$valid = [
    'version' => '1.1','surface' => 'builder','authority' => 'presentation-only','root' => 'root','state' => [],
    'data_sources' => ['crm-business-services'],
    'elements' => [
        'root' => ['type' => 'stack','props' => [],'children' => ['button']],
        'button' => ['type' => 'button','props' => ['label' => 'Preview'],'on' => ['click' => ['action' => 'builder.preview']]],
    ],
];
$runtime->response = $valid;
$out = $generator->propose('Build a safe preview', [
    'company_id' => 42,
    'surface' => 'builder',
    'available_components' => $registry->componentIds(),
    'available_data_sources' => ['crm-business-services'],
    'available_action_intents' => ['builder.preview'],
    'secret_api_key' => 'must-not-pass',
]);
if (($out['root'] ?? null) !== 'root') { throw new RuntimeException('Valid TitanAI proposal was not accepted.'); }
if (array_key_exists('secret_api_key', $runtime->lastContext)) { throw new RuntimeException('Unrelated secret context leaked to TitanAI.'); }

$cases = [
    'unknown-component' => (function () use ($valid) { $x=$valid; $x['elements']['button']['type']='does-not-exist'; return $x; })(),
    'unknown-action' => (function () use ($valid) { $x=$valid; $x['elements']['button']['on']['click']['action']='crm.unknown.execute'; return $x; })(),
    'unknown-data-source' => (function () use ($valid) { $x=$valid; $x['data_sources']=['crm-unknown']; return $x; })(),
    'raw-html' => (function () use ($valid) { $x=$valid; $x['elements']['button']['props']['innerHTML']='<script>alert(1)</script>'; return $x; })(),
    'company-override' => (function () use ($valid) { $x=$valid; $x['company_id']=99; return $x; })(),
];
foreach ($cases as $name => $proposal) {
    $runtime->response = $proposal;
    $failed = false;
    try { $generator->propose('unsafe case', ['company_id' => 42, 'surface' => 'builder']); } catch (InvalidArgumentException) { $failed = true; }
    if (! $failed) { throw new RuntimeException("TitanAI governance failed for {$name}"); }
}


$runtime->response = (function () use ($valid) { $x=$valid; $x['elements']['button']['on']['click']['action']='crm.work_order.assign'; return $x; })();
$failed = false;
try {
    $generator->propose('known but unavailable action', [
        'company_id' => 42,
        'surface' => 'builder',
        'available_action_intents' => ['builder.preview'],
        'available_data_sources' => ['crm-business-services'],
    ]);
} catch (InvalidArgumentException) { $failed = true; }
if (! $failed) { throw new RuntimeException('TitanAI accepted a globally known action unavailable to this company.'); }

$runtime->response = (function () use ($valid) { $x=$valid; $x['data_sources']=['crm-owner-operations-summary']; return $x; })();
$failed = false;
try {
    $generator->propose('known but unavailable data source', [
        'company_id' => 42,
        'surface' => 'builder',
        'available_action_intents' => ['builder.preview'],
        'available_data_sources' => ['crm-business-services'],
    ]);
} catch (InvalidArgumentException) { $failed = true; }
if (! $failed) { throw new RuntimeException('TitanAI accepted a globally known data source unavailable to this company.'); }

echo "TitanAI adapter governance PASS\n";
