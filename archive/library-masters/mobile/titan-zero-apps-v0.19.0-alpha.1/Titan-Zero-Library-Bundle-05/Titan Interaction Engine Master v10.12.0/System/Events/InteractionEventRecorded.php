<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Events;

final readonly class InteractionEventRecorded
{
    public function __construct(
        public string $eventType,
        public array $data,
    ) {}
}
