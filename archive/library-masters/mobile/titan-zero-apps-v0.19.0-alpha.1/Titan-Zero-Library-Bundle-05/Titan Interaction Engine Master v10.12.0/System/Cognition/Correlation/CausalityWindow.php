<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Cognition\Correlation;

use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEvent;

final class CausalityWindow
{
    public function __construct(private readonly int $seconds = 86400) {}

    public function contains(CognitiveEvent $cause, CognitiveEvent $effect): bool
    {
        if ($cause->companyId !== $effect->companyId || $cause->subjectType !== $effect->subjectType || $cause->subjectId !== $effect->subjectId) {
            return false;
        }
        $delta = strtotime($effect->occurredAt) - strtotime($cause->occurredAt);
        return $delta >= 0 && $delta <= $this->seconds;
    }
}
