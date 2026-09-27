<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkTraySnapshot;

interface GlobalWorkTrayAggregatorContract
{
    public function aggregate(InterfaceContext $context, string $tray, ?int $limit = null): GlobalWorkTraySnapshot;

    /** @return array<string,GlobalWorkTraySnapshot> */
    public function all(InterfaceContext $context, ?int $limitPerTray = null): array;
}
