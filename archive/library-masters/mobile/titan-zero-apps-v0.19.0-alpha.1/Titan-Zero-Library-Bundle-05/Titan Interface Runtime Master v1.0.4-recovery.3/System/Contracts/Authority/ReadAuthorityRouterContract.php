<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;

interface ReadAuthorityRouterContract
{
    public function read(InterfaceContext $context, string $authority, string $mode, string $reference, ReadQuery $query): AuthorityReadResult;
}
