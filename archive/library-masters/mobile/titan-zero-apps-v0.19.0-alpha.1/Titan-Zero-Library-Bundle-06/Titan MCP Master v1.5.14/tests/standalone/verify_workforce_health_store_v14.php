<?php
declare(strict_types=1);
$root=dirname(__DIR__,2);
$base=$root.'/System/Workforce/';
foreach (['ProviderHealthSnapshot.php','ProviderHealthStoreContract.php','LaravelCacheProviderHealthStore.php'] as $f) require_once $base.$f;
use App\Extensions\TitanMcp\System\Workforce\ProviderHealthSnapshot;
use App\Extensions\TitanMcp\System\Workforce\LaravelCacheProviderHealthStore;

final class FakeCache {
    public array $data=[];
    public function put(string $key,mixed $value,int $ttl): void { $this->data[$key]=$value; }
    public function get(string $key): mixed { return $this->data[$key]??null; }
}
$cache=new FakeCache();
$store=new LaravelCacheProviderHealthStore($cache);
$s=new ProviderHealthSnapshot(42,'provider-x','healthy','probe_ok',100,400);
$store->put($s);
$got=$store->get(42,'provider-x',101);
if (!$got || $got->state!=='healthy' || $got->companyId!==42) { fwrite(STDERR,"persist/read failed\n"); exit(1); }
if ($store->get(42,'provider-x',401)!==null) { fwrite(STDERR,"stale health must not resolve\n"); exit(1); }
if ($store->get(43,'provider-x',101)!==null) { fwrite(STDERR,"company scope leaked\n"); exit(1); }
echo "WORKFORCE_HEALTH_STORE_V14: PASS\n";
