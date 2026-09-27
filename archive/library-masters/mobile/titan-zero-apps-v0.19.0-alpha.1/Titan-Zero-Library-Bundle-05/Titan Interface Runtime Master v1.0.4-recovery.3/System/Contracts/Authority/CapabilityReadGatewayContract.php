<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;

interface CapabilityReadGatewayContract
{
    public function supports(string $authority,string $reference): bool;
    /** @param array<string,mixed> $criteria */
    public function read(InterfaceContext $context,string $authority,string $reference,array $criteria=[]): AuthorityReadResult|array;
}
