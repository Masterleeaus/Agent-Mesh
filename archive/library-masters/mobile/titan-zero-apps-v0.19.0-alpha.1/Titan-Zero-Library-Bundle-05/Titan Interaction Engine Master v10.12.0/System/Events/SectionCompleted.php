<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Events;

class SectionCompleted
{
    public function __construct(
        public int $runId,
        public string $sectionId,
        public int $sectionIndex,
    ) {}
}
