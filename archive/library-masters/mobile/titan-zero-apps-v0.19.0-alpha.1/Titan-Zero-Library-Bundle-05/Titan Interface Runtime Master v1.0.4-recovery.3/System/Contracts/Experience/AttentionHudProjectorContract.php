<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Experience\AttentionHudSnapshot;

interface AttentionHudProjectorContract
{
    public function project(InterfaceContext $context, int $limit = 8): AttentionHudSnapshot;
}
