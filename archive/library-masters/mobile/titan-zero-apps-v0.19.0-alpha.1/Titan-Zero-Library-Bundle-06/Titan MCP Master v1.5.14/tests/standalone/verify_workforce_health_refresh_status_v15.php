<?php
declare(strict_types=1);
$root=dirname(__DIR__,2);
$base=$root.'/System/Workforce/';
foreach ([
 'WorkforceProviderRuntimeContract.php','ProviderHealthSnapshot.php','ProviderHealthStoreContract.php',
 'ProviderHealthProbeContract.php','PackageWorkforceProviderAdapter.php','ProviderHealthProbe.php',
 'WorkforceProviderEventEmitter.php','ProviderHealthRefreshService.php','WorkforceProviderStatus.php',
 'WorkforceProviderStatusService.php'
] as $f) require_once $base.$f;

use App\Extensions\TitanMcp\System\Workforce\PackageWorkforceProviderAdapter;
use App\Extensions\TitanMcp\System\Workforce\ProviderHealthStoreContract;
use App\Extensions\TitanMcp\System\Workforce\ProviderHealthSnapshot;
use App\Extensions\TitanMcp\System\Workforce\ProviderHealthProbeContract;
use App\Extensions\TitanMcp\System\Workforce\WorkforceProviderEventEmitter;
use App\Extensions\TitanMcp\System\Workforce\ProviderHealthRefreshService;
use App\Extensions\TitanMcp\System\Workforce\WorkforceProviderStatusService;

final class MemoryStore implements ProviderHealthStoreContract {
    public array $rows=[];
    private function key(int|string $companyId,string $providerKey): string { return (string)$companyId.':'.$providerKey; }
    public function put(ProviderHealthSnapshot $snapshot): void { $this->rows[$this->key($snapshot->companyId,$snapshot->providerKey)]=$snapshot; }
    public function get(int|string $companyId,string $providerKey,int $now): ?ProviderHealthSnapshot {
        $s=$this->rows[$this->key($companyId,$providerKey)]??null;
        return ($s instanceof ProviderHealthSnapshot && $s->isFresh($now))?$s:null;
    }
}
final class FakeDispatcher {
    public array $events=[];
    public function dispatch(string $name,array $payload): void { $this->events[] = [$name,$payload]; }
}
final class HealthyProbe implements ProviderHealthProbeContract {
    public function __construct(private readonly string $providerKey) {}
    public function probe(int|string $companyId,int $now): ProviderHealthSnapshot {
        return new ProviderHealthSnapshot($companyId,$this->providerKey,'healthy','probe_ok',$now,$now+300);
    }
}

$provider=PackageWorkforceProviderAdapter::fromPackageRoot($root);
$store=new MemoryStore();
$dispatcher=new FakeDispatcher();
$events=new WorkforceProviderEventEmitter($dispatcher);
$refresh=new ProviderHealthRefreshService(new HealthyProbe($provider->providerKey()),$store,$events);
$s=$refresh->refresh(88,100);
if ($s->state!=='healthy') { fwrite(STDERR,"refresh failed\n"); exit(1); }
if (count($dispatcher->events)!==2) { fwrite(STDERR,"first refresh must emit health+transition\n"); exit(1); }
$status=(new WorkforceProviderStatusService($provider,$store))->status(88,101);
if ($status->healthState!=='healthy' || $status->companyId!==88 || $status->capabilityCount<1) { fwrite(STDERR,"status failed\n"); exit(1); }
$missing=(new WorkforceProviderStatusService($provider,$store))->status(89,101);
if ($missing->healthState!=='unavailable') { fwrite(STDERR,"cross-company status leaked\n"); exit(1); }
echo "WORKFORCE_HEALTH_REFRESH_STATUS_V15: PASS\n";
