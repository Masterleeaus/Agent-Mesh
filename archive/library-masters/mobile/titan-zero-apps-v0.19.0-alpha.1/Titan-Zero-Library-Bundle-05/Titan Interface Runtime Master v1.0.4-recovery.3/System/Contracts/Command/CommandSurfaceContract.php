<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Command;

use App\Extensions\TitanInterfaceRuntime\System\Command\CommandSurfaceSnapshot;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;

interface CommandSurfaceContract
{
    public function search(string $query, InterfaceContext $context, ?int $limit = null): CommandSurfaceSnapshot;
}
