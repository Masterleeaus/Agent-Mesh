<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Security;

use DomainException;

final class HubProjectionGuard
{
    private const FORBIDDEN=['password','password_hash','remember_token','api_key','secret','credentials','internal_notes','cost_price','margin','tenant_company_id','tenant_id'];
    public function assertSafe(array $projection): array
    {
        $this->walk($projection,[]);return $projection;
    }
    private function walk(array $value,array $path): void
    {
        foreach($value as $key=>$child){
            $segment=strtolower((string)$key);$next=[...$path,(string)$key];
            if(in_array($segment,self::FORBIDDEN,true)) throw new DomainException('Unsafe Hub projection field: '.implode('.',$next));
            if(is_array($child))$this->walk($child,$next);
        }
    }
}
