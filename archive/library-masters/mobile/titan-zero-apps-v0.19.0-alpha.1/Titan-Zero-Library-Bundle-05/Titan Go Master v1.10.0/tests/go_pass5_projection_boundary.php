<?php

declare(strict_types=1);

require_once __DIR__.'/../System/Contracts/GoProjectionPolicy.php';

use App\Extensions\TitanGo\System\Contracts\GoProjectionPolicy;

$failures = 0;
$check = static function (bool $ok, string $message) use (&$failures): void {
    echo ($ok ? 'PASS ' : 'FAIL ').$message."\n";
    if (!$ok) $failures++;
};
$rejects = static function (array $payload) use ($check): void {
    try { GoProjectionPolicy::assertProjection($payload); $check(false, 'unsafe projection rejected'); }
    catch (InvalidArgumentException) { $check(true, 'unsafe projection rejected'); }
};

GoProjectionPolicy::assertProjection(['surface'=>'go','projection_type'=>'job.summary','data'=>['job'=>['id'=>'j1','status'=>'assigned']]]);
$check(true, 'normal worker-safe projection accepted');

$rejects(['surface'=>'go','projection_type'=>'job.summary','data'=>['accessToken'=>'secret']]);
$rejects(['surface'=>'go','projection_type'=>'job.summary','data'=>['raw-model'=>['id'=>1]]]);
$rejects(['surface'=>'go','projection_type'=>'job.summary','data'=>['Provider_Credentials'=>['key'=>'x']]]);
$rejects(['surface'=>'go','projection_type'=>'job.summary','data'=>['object'=>(object)['id'=>1]]]);

$deep=['value'=>'ok'];
for($i=0;$i<26;$i++) $deep=['nested'=>$deep];
$rejects(['surface'=>'go','projection_type'=>'job.summary','data'=>$deep]);

exit($failures === 0 ? 0 : 1);
