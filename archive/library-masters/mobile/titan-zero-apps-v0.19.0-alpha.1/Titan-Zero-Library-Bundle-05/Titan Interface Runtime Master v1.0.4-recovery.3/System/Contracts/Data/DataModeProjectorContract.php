<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Data;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Data\DataModeProjection;

interface DataModeProjectorContract
{
    public function forObject(string $objectKey, InterfaceContext $context): DataModeProjection;
}
