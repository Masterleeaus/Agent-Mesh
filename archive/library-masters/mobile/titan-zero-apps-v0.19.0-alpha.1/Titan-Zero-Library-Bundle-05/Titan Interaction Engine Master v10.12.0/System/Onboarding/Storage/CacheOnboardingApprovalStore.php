<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Onboarding\Storage;

use Illuminate\Contracts\Cache\Repository;

final class CacheOnboardingApprovalStore implements OnboardingApprovalStoreInterface
{
    public function __construct(private readonly Repository $cache) {}
    public function put(string $companyId,string $planId,string $actionId,array $grant,int $ttlSeconds=900):void{$this->cache->put($this->key($companyId,$planId,$actionId),$grant,max(1,$ttlSeconds));}
    public function get(string $companyId,string $planId,string $actionId):?array{$v=$this->cache->get($this->key($companyId,$planId,$actionId));return is_array($v)?$v:null;}
    private function key(string$c,string$p,string$a):string{return'interaction-engine:onboarding-approval:'.hash('sha256',$c).':'.$p.':'.$a;}
}
