<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

use App\Extensions\InteractionEngine\System\DTO\InteractionDefinition;

interface RendererInterface
{
    public function render(InteractionDefinition $definition, array $state, array $options = []): string;
}
