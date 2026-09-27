<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System;

use App\Extensions\InteractionEngine\System\Contracts\InteractionEngineManagerContract;
use App\Extensions\InteractionEngine\System\Lifecycle\ExtensionState;
use App\Extensions\InteractionEngine\System\Monitoring\HealthCheck;

final class InteractionEngineManager implements InteractionEngineManagerContract
{
    public function __construct(
        private readonly HealthCheck $healthCheck,
        private readonly ExtensionState $state,
    ) {
    }

    public function health(): array
    {
        return $this->healthCheck->run() + ['enabled' => $this->state->enabled()];
    }

    public function isEnabled(): bool
    {
        return $this->state->enabled();
    }
}
