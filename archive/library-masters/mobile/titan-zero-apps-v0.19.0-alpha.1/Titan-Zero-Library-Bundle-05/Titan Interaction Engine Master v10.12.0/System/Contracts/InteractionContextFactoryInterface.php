<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

interface InteractionContextFactoryInterface
{
    public function make(
        string $companyId,
        string $actorId,
        string $surface,
        ?string $journey = null,
        ?string $deviceId = null,
        array $roles = [],
        array $capabilities = [],
        array $metadata = []
    ): InteractionContext;
}
