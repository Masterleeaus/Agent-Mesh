<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts;

interface ActionIntentDispatcher
{
    /** @param array<string,mixed> $intent @return array<string,mixed> */
    public function dispatch(array $intent): array;
}
