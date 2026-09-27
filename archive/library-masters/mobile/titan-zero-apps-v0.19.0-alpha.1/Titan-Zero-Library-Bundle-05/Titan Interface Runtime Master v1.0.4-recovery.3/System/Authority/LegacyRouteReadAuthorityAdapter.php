<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Authority;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityAdapterContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Data\LegacyRouteLocatorContract;

final readonly class LegacyRouteReadAuthorityAdapter implements ReadAuthorityAdapterContract
{
    public function __construct(private LegacyRouteLocatorContract $routes,private bool $allowHub=false){}
    public function supports(string $authority,string $mode):bool{return $mode==='legacy-route';}
    public function read(InterfaceContext $context,string $authority,string $reference,array $criteria=[]):AuthorityReadResult
    {
        if($context->productSurface==='hub' && !$this->allowHub)throw new AuthorityReadException('Legacy expert/admin routes are unavailable on Hub.');
        $url=$this->routes->url($reference);
        if($url===null)throw new AuthorityReadException("Legacy route {$reference} is unavailable.");
        return new AuthorityReadResult($authority,$reference,[['url'=>$url,'embed_policy'=>'deep-link']],['source'=>'legacy-route','adapter'=>self::class,'retrieved_at'=>gmdate(DATE_ATOM)]);
    }
}
