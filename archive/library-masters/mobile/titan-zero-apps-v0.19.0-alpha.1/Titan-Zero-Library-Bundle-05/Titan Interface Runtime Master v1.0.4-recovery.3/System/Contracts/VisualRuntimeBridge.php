<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts;

interface VisualRuntimeBridge
{
    /** @param array<string,mixed> $semanticTree @return array<string,mixed> */
    public function decorate(array $semanticTree, array $visualHints, array $environment = []): array;
}
