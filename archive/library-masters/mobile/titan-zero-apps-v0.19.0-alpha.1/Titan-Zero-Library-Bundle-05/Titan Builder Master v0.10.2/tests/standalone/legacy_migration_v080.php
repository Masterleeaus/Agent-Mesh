<?php

declare(strict_types=1);
$root = dirname(__DIR__, 2);
require_once $root.'/System/Migration/LegacyBusinessSpecMigrator.php';
use App\Extensions\TitanBuilder\System\Migration\LegacyBusinessSpecMigrator;
$m = new LegacyBusinessSpecMigrator();
$result = $m->migrate([
    'actions' => ['workcore.customers.create','workcore.jobs.assign','workcore.inventory.reserve'],
    'read_models' => ['jobs.assigned','finance.summary'],
    'binding' => ['action' => 'workcore.properties.create'],
]);
$v=$result['value'];
if (($v['actions'][0] ?? null) !== 'crm.customer.create' || ($v['actions'][1] ?? null) !== 'crm.work_order.assign') { throw new RuntimeException('Deterministic action migration failed.'); }
if (in_array('workcore.inventory.reserve', $v['actions'] ?? [], true)) { throw new RuntimeException('Ambiguous action was not removed.'); }
if (($v['read_models'][0] ?? null) !== 'crm.field.assigned-work' || ($v['read_models'][1] ?? null) !== 'crm.owner.finance-summary') { throw new RuntimeException('Read-model migration failed.'); }
if (($v['meta']['migration_review_required'] ?? false) !== true || count($result['review']) < 2) { throw new RuntimeException('Ambiguous migration review was not surfaced.'); }
echo "Legacy v0.7 migration PASS\n";
