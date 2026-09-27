<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Authority;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\CapabilityReadGatewayContract;

final class NullCapabilityReadGateway implements CapabilityReadGatewayContract
{
    public function supports(string $authority,string $reference): bool{return false;}
    public function read(InterfaceContext $context,string $authority,string $reference,array $criteria=[]): AuthorityReadResult|array{throw new AuthorityReadException('No governed capability read gateway is bound.');}
}
