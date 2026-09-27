<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Collection;

use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Collection\CollectionViewSnapshot;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;

interface CollectionViewSwitcherContract
{
    public function open(string $objectKey, InterfaceContext $context, ReadQuery $query, ?string $requestedViewKey = null): CollectionViewSnapshot;
    public function reproject(CollectionViewSnapshot $snapshot, string $viewKey, InterfaceContext $context): CollectionViewSnapshot;
}
