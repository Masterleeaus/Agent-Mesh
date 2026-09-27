<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Authority;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\CapabilityReadGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityAdapterContract;

final readonly class CapabilityReadAuthorityAdapter implements ReadAuthorityAdapterContract
{
    public function __construct(private CapabilityReadGatewayContract $gateway){}
    public function supports(string $authority,string $mode):bool{return $mode==='capability';}
    public function read(InterfaceContext $context,string $authority,string $reference,array $criteria=[]):AuthorityReadResult
    {
        if(!$this->gateway->supports($authority,$reference))throw new AuthorityReadException("Capability read {$authority}/{$reference} is not available.");
        $result=$this->gateway->read($context,$authority,$reference,$criteria);
        if($result instanceof AuthorityReadResult)return $result;
        if(!is_array($result))throw new AuthorityReadException('Capability read gateway returned an unsupported payload.');
        return new AuthorityReadResult($authority,$reference,$result,['source'=>'capability','adapter'=>self::class,'retrieved_at'=>gmdate(DATE_ATOM)]);
    }
}
