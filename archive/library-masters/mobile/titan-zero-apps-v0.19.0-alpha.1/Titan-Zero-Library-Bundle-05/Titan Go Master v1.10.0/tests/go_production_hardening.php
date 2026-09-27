<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\TitanGo\\';
    if (!str_starts_with($class, $prefix)) return;
    $file = $root.'/'.str_replace('\\', '/', substr($class, strlen($prefix))).'.php';
    if (is_file($file)) require_once $file;
});

$fails = [];
$check = function (bool $condition, string $message) use (&$fails): void {
    echo ($condition ? 'PASS ' : 'FAIL ').$message."\n";
    if (!$condition) $fails[] = $message;
};

$field = new App\Extensions\TitanGo\System\Integration\TitanFieldMobileGateway();
$check($field->contextRoute() === 'titan-field.mobile.context', 'Titan Field context route is consumed through stable named contract');
$check($field->syncRoute() === 'titan-field.mobile.sync', 'Titan Field sync route is consumed through stable named contract');
$check($field->maxBatchSize() === 100, 'offline batch limit matches Titan Field provider contract');
$check(in_array('work_order.complete', $field->replayOperations(), true), 'work order completion replay supported');
$check(in_array('location.batch', $field->replayOperations(), true), 'offline location replay supported');

$policy = new App\Extensions\TitanGo\System\Offline\GoOfflineReplayPolicy($field);
$operation = new App\Extensions\TitanGo\System\Offline\GoOfflineOperation(
    'company-1', 'worker-1', 'device-1', 'work_order.complete', 'op-1', date(DATE_ATOM),
    ['work_order_public_id' => '01TEST'], 4, 'work_order', '01TEST', ['trace_id' => 'trace-1']
);
$policy->validate($operation);
$envelope = (new App\Extensions\TitanGo\System\Offline\DeviceQueueEnvelopeFactory($policy))->make($operation);
$check($envelope['operation'] === 'work_order.complete', 'provider replay operation field emitted');
$check($envelope['base_entity_version'] === 4, 'provider conflict base version emitted');
$check($envelope['replay_authority'] === 'provider_capability_gateway', 'provider remains replay authority');
$check($envelope['conflict_policy'] === 'provider_authoritative_entity_version', 'provider entity version remains conflict authority');

try {
    $policy->validate(new App\Extensions\TitanGo\System\Offline\GoOfflineOperation('c','a','d','raw.sql.execute','x',date(DATE_ATOM),[]));
    $check(false, 'unregistered offline operations rejected');
} catch (InvalidArgumentException) {
    $check(true, 'unregistered offline operations rejected');
}

try {
    $policy->validateBatch(array_fill(0, 101, $operation));
    $check(false, 'offline batch size capped');
} catch (InvalidArgumentException) {
    $check(true, 'offline batch size capped');
}

$manifest = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true);
$check(($manifest['version'] ?? '') === '1.10.0', 'Go version advanced to 1.10.0');
$check(($manifest['offline']['provider_contract'] ?? '') === 'titan-field.mobile.v1', 'provider mobile contract declared');
$check(in_array('App\\Extensions\\TitanGo\\System\\Contracts\\TitanFieldMobileGatewayInterface', $manifest['public_contracts'] ?? [], true), 'mobile gateway public contract declared');

exit($fails ? 1 : 0);
