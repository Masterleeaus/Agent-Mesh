<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

interface ContextProviderInterface
{
    public function provide(array $state): array;
}
