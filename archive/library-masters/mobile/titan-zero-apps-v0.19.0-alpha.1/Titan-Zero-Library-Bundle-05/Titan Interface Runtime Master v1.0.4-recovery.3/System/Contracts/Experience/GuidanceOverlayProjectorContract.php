<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Experience\GuidanceOverlaySnapshot;

interface GuidanceOverlayProjectorContract
{
    /** @param list<array<string,mixed>> $steps */
    public function project(InterfaceContext $context, array $steps): GuidanceOverlaySnapshot;
}
