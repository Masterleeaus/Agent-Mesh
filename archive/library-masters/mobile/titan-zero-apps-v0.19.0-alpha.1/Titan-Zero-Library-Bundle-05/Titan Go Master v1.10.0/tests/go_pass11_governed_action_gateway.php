<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(function (string $class) use ($root): void {
    $prefixes = [
        'App\\Extensions\\TitanGo\\' => $root.'/',
        'App\\Extensions\\InteractionEngine\\' => dirname($root).'/InteractionEngine/',
    ];
    foreach ($prefixes as $prefix => $base) {
        if (str_starts_with($class, $prefix)) {
            $file = $base.str_replace('\\', '/', substr($class, strlen($prefix))).'.php';
            if (is_file($file)) require_once $file;
            return;
        }
    }
});

use App\Extensions\InteractionEngine\System\Contracts\CapabilityIntentGatewayInterface;
use App\Extensions\TitanGo\System\Integration\InteractionEngineGoActionIntentGateway;

final class FakeCapabilityGateway implements CapabilityIntentGatewayInterface {
    public array $last = [];
    public function dispatch(string $capability, array $payload, array $trustedContext): array {
        $this->last = compact('capability', 'payload', 'trustedContext');
        return ['status' => 'executed', 'authority' => 'interaction-engine-governed'];
    }
}

$fail=[];
$ok=function(bool $condition,string $message)use(&$fail){echo($condition?'PASS ':'FAIL ').$message."\n";if(!$condition)$fail[]=$message;};
$fake=new FakeCapabilityGateway();
$gateway=new InteractionEngineGoActionIntentGateway($fake);
$result=$gateway->submit('company-1','worker-7','field.job.complete',['job_id'=>'job-9'],[
    'idempotency_key'=>'idem-1','device_id'=>'device-3','correlation_id'=>'corr-1'
]);
$ok(($result['authority']??null)==='interaction-engine-governed','action delegates to Interaction Engine governed gateway');
$ok(($fake->last['trustedContext']['company_id']??null)==='company-1','trusted company_id forwarded');
$ok(($fake->last['trustedContext']['actor_id']??null)==='worker-7','trusted actor forwarded');
$ok(($fake->last['trustedContext']['source_surface']??null)==='go','Go source surface enforced');
$ok(($fake->last['trustedContext']['idempotency_key']??null)==='idem-1','idempotency key enforced and forwarded');
$ok(!array_key_exists('company_id',$fake->last['payload']),'payload cannot become company authority');

$reject=function(callable $fn,string $message)use($ok){try{$fn();$ok(false,$message);}catch(InvalidArgumentException){$ok(true,$message);}};
$reject(fn()=>$gateway->submit('company-1','worker-7','field.job.complete',['company_id'=>'company-2'],['idempotency_key'=>'x']),'payload company_id authority rejected');
$reject(fn()=>$gateway->submit('company-1','worker-7','field.job.complete',['tenant_id'=>'legacy'],['idempotency_key'=>'x']),'legacy tenant authority rejected');
$reject(fn()=>$gateway->submit('company-1','worker-7','field.job.complete',['job_id'=>'j'],[]),'missing idempotency rejected');
$reject(fn()=>$gateway->submit('company-1','worker-7','field.job.complete',['job_id'=>'j'],['idempotency_key'=>'x','company_id'=>'company-2']),'conflicting trusted company rejected');
$reject(fn()=>$gateway->submit('company-1','worker-7','field.job.complete',['permissions'=>['admin']],['idempotency_key'=>'x']),'payload permissions authority rejected');
$reject(fn()=>$gateway->submit('company-1','worker-7','INVALID INTENT',['job_id'=>'j'],['idempotency_key'=>'x']),'invalid capability intent rejected');

$provider=file_get_contents($root.'/System/TitanGoServiceProvider.php');
$ok(str_contains($provider,'GoActionIntentGatewayInterface::class, InteractionEngineGoActionIntentGateway::class'),'service provider binds governed Go action adapter');

exit($fail?1:0);
