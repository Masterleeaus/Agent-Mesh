<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Collection;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;

interface CollectionViewPreferenceStoreContract
{
    public function get(InterfaceContext $context, string $objectKey): ?string;
    public function put(InterfaceContext $context, string $objectKey, string $viewKey): void;
}
