<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Events;

class InteractionStarted
{
    public function __construct(
        public int $runId,
        public int $userId,
        public string $interactionId,
        public string $definitionVersion,
        public array $metadata = []
    ) {}
}
