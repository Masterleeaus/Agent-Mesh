<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\TitanGo\\';
    if (!str_starts_with($class, $prefix)) return;
    $file = $root.'/'.str_replace('\\', '/', substr($class, strlen($prefix))).'.php';
    if (is_file($file)) require_once $file;
});

use App\Extensions\TitanGo\System\Integration\TitanFieldMobileGateway;
use App\Extensions\TitanGo\System\Offline\GoOfflineBatchEnvelopeFactory;
use App\Extensions\TitanGo\System\Offline\GoOfflineOperation;
use App\Extensions\TitanGo\System\Offline\GoOfflineReplayPolicy;

$fail = [];
$check = function (bool $ok, string $message) use (&$fail): void {
    echo ($ok ? 'PASS ' : 'FAIL ').$message."\n";
    if (!$ok) $fail[] = $message;
};
$op = static fn(string $company, string $actor, string $device, string $id) => new GoOfflineOperation(
    $company, $actor, $device, 'work_order.note', $id, date(DATE_ATOM), ['note' => 'safe']
);
$policy = new GoOfflineReplayPolicy(new TitanFieldMobileGateway());
$scope = $policy->validateBatch([$op('c1','a1','d1','o1'), $op('c1','a1','d1','o2')]);
$check($scope === ['company_id'=>'c1','actor_id'=>'a1','device_id'=>'d1'], 'batch scope resolves from canonical operation context');
$batch = (new GoOfflineBatchEnvelopeFactory($policy))->make([$op('c1','a1','d1','o3')]);
$check(($batch['company_id'] ?? null) === 'c1', 'batch envelope carries canonical company_id');
$check(!array_key_exists('tenant_id', $batch), 'batch envelope does not emit tenant_id');
$check(($batch['idempotency'] ?? null) === 'operation_id', 'batch declares operation_id idempotency');
foreach ([
    [$op('c1','a1','d1','o4'), $op('c2','a1','d1','o5')],
    [$op('c1','a1','d1','o6'), $op('c1','a2','d1','o7')],
    [$op('c1','a1','d1','o8'), $op('c1','a1','d2','o9')],
] as $index => $mixed) {
    try { $policy->validateBatch($mixed); $check(false, 'mixed batch '.($index+1).' rejected'); }
    catch (InvalidArgumentException) { $check(true, 'mixed batch '.($index+1).' rejected'); }
}
exit($fail ? 1 : 0);
