<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

use App\Extensions\InteractionEngine\System\DTO\InteractionDefinition;

interface GeneratorInterface
{
    public function generate(array $requirements): InteractionDefinition;
    public function suggestInteractions(int $userId, array $context): array;
}
