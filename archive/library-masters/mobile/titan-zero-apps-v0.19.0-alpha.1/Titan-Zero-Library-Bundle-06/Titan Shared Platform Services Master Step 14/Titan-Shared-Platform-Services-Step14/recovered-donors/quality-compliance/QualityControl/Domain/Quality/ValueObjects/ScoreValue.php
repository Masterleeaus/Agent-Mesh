<?php

namespace Modules\QualityControl\Domain\Quality\ValueObjects;

use InvalidArgumentException;

final class ScoreValue
{
    public function __construct(public readonly int $value)
    {
        if ($value < 0 || $value > 100) {
            throw new InvalidArgumentException('Score must be between 0 and 100.');
        }
    }
}
