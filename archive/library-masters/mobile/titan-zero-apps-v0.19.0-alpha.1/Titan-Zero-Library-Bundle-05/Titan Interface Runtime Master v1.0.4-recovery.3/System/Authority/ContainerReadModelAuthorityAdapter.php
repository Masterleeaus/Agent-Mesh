<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Authority;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\InterfaceReadModelProviderContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityAdapterContract;
use Illuminate\Contracts\Container\Container;

final readonly class ContainerReadModelAuthorityAdapter implements ReadAuthorityAdapterContract
{
    public function __construct(private Container $container){}
    public function supports(string $authority,string $mode): bool{return $mode==='read-model' && $this->container->bound($this->binding($authority));}
    public function read(InterfaceContext $context,string $authority,string $reference,array $criteria=[]): AuthorityReadResult
    {
        $provider=$this->container->make($this->binding($authority));
        if(!$provider instanceof InterfaceReadModelProviderContract)throw new AuthorityReadException("Read-model binding for {$authority} does not implement the Interface Runtime provider contract.");
        $result=$provider->read($context,$reference,$criteria);
        if($result instanceof AuthorityReadResult)return $result;
        if(!is_array($result))throw new AuthorityReadException('Read-model provider returned an unsupported payload.');
        return new AuthorityReadResult($authority,$reference,$result,['source'=>'read-model','adapter'=>self::class,'retrieved_at'=>gmdate(DATE_ATOM)]);
    }
    private function binding(string $authority):string{return 'titan.interface.read-model.'.$authority;}
}
