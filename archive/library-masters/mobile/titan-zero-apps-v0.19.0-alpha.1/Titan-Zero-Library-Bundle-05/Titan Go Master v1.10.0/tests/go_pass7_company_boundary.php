<?php

declare(strict_types=1);

$root = dirname(__DIR__);
require_once $root.'/System/Offline/GoOfflineOperation.php';
require_once $root.'/System/Offline/GoOfflineOperationPolicy.php';

use App\Extensions\TitanGo\System\Offline\GoOfflineOperation;
use App\Extensions\TitanGo\System\Offline\GoOfflineOperationPolicy;

$checks = 0;
$assert = static function (bool $ok, string $message) use (&$checks): void { if (!$ok) throw new RuntimeException($message); $checks++; };
$op = new GoOfflineOperation('company-a','worker-1','device-1','field.job.complete','op-1',date(DATE_ATOM),[]);
$data = $op->toArray();
$assert(($data['company_id'] ?? null) === 'company-a', 'Go envelope must emit company_id.');
$assert(!array_key_exists('tenant_id', $data) && !array_key_exists('tenant_company_id', $data), 'Go envelope must not emit a second tenant boundary.');
$policy = new GoOfflineOperationPolicy();
$policy->validate($op);
foreach (['tenant_id','tenantId','tenant-company-id','tenantBoundary'] as $legacyKey) {
    try {
        $policy->validate(new GoOfflineOperation('company-a','worker-1','device-1','field.job.complete','op-'.$legacyKey,date(DATE_ATOM),[],null,null,null,[$legacyKey => 'other']));
        throw new RuntimeException('Legacy tenant alias escaped Go audit boundary: '.$legacyKey);
    } catch (InvalidArgumentException $e) {
        $assert(str_contains($e->getMessage(), 'forbidden'), 'Legacy tenant alias must fail as non-authoritative audit metadata.');
    }
}
echo "Pass 7 Go company boundary checks passed: {$checks}/{$checks}\n";
