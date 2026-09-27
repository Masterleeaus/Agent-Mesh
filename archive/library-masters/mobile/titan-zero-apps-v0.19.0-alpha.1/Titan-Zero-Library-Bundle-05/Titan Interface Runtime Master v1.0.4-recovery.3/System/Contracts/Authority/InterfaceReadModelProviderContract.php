<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;

interface InterfaceReadModelProviderContract
{
    /** @param array<string,mixed> $criteria */
    public function read(InterfaceContext $context,string $reference,array $criteria=[]): AuthorityReadResult|array;
}
