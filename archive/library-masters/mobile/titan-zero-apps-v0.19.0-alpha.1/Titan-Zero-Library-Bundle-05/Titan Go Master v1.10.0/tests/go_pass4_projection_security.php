<?php

declare(strict_types=1);

$root = dirname(__DIR__);
require_once $root.'/System/Contracts/GoProjectionPolicy.php';

use App\Extensions\TitanGo\System\Contracts\GoProjectionPolicy;

$failures = [];
$check = static function (bool $ok, string $message) use (&$failures): void {
    echo ($ok ? 'PASS ' : 'FAIL ').$message."\n";
    if (!$ok) $failures[] = $message;
};

GoProjectionPolicy::assertProjection([
    'surface' => 'go',
    'worker' => ['display_name' => 'Alex'],
    'jobs' => [['public_id' => 'job_01', 'status' => 'assigned']],
]);
$check(true, 'worker-safe nested projection accepted');

foreach ([
    ['raw_record' => ['id' => 1]],
    ['job' => ['database_row' => ['id' => 1]]],
    ['worker' => ['credentials' => ['token' => 'x']]],
    ['job' => ['permissions' => ['admin' => true]]],
    ['job' => ['raw_sql' => 'delete from jobs']],
] as $forbidden) {
    try {
        GoProjectionPolicy::assertProjection(['surface' => 'go'] + $forbidden);
        $check(false, 'forbidden nested projection data rejected');
    } catch (InvalidArgumentException) {
        $check(true, 'forbidden nested projection data rejected');
    }
}

try {
    GoProjectionPolicy::assertProjection(['surface' => 'zero', 'jobs' => []]);
    $check(false, 'non-Go projection rejected');
} catch (InvalidArgumentException) {
    $check(true, 'non-Go projection rejected');
}

exit($failures ? 1 : 0);
