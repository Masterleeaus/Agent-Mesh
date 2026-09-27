<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

use App\Extensions\InteractionEngine\System\DTO\InteractionDefinition;

interface NavigationEngineInterface
{
    public function getNextSectionIndex(array $state, InteractionDefinition $definition): ?int;
    public function getPreviousSectionIndex(array $state, InteractionDefinition $definition): ?int;
}
