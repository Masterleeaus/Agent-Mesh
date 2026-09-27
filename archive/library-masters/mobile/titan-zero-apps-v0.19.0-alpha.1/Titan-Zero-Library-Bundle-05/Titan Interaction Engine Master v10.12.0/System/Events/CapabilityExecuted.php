<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Events;

class CapabilityExecuted
{
    public function __construct(
        public string $capability,
        public array $payload,
        public bool $success,
        public ?string $error = null,
    ) {}
}
