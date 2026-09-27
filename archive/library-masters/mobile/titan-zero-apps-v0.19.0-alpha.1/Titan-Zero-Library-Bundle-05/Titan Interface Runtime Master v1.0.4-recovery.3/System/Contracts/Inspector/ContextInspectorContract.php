<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Inspector;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Inspector\InspectorSnapshot;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;

interface ContextInspectorContract
{
    public function inspect(ObjectReference $reference, InterfaceContext $context): InspectorSnapshot;
}
