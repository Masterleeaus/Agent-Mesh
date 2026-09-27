<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Events;

class QuestionAnswered
{
    public function __construct(
        public int $runId,
        public string $questionKey,
        public mixed $value,
        public string $source,
        public ?float $confidence = null,
    ) {}
}
