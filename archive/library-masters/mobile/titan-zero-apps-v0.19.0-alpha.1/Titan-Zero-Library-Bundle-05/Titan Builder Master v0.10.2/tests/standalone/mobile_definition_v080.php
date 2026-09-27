<?php

declare(strict_types=1);
$root = dirname(__DIR__, 2);
require_once $root.'/System/Provisioning/TitanApplicationDefinition.php';
use App\Extensions\TitanBuilder\System\Provisioning\TitanApplicationDefinition;
$base = [
    'schema_version' => TitanApplicationDefinition::SCHEMA,
    'company_id' => 42,
    'project_id' => 7,
    'surface' => 'field',
    'product' => 'Titan Go',
    'pages' => [],
    'data_sources' => ['crm-field-assigned-work'],
    'action_intents' => ['crm.work_order.task.complete'],
    'notifications' => [],
    'credentials' => null,
];
$out = TitanApplicationDefinition::fromArray($base)->toArray();
if ($out['company_id'] !== 42 || $out['surface'] !== 'field') { throw new RuntimeException('Mobile definition DTO changed identity.'); }
foreach ([
    ['credentials' => ['token' => 'bad']],
    ['company_id' => 0],
    ['surface' => 'unknown'],
    ['schema_version' => 'future/99'],
] as $change) {
    $failed=false;
    try { TitanApplicationDefinition::fromArray([...$base, ...$change]); } catch (InvalidArgumentException) { $failed=true; }
    if (!$failed) { throw new RuntimeException('Invalid mobile definition was accepted: '.json_encode($change)); }
}
echo "Titan Mobile definition contract PASS\n";
