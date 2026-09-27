<?php

namespace Modules\QualityControl\Domain\Quality\ValueObjects;

final class SeverityLevel
{
    public const LOW = 'low';
    public const MEDIUM = 'medium';
    public const HIGH = 'high';
    public const CRITICAL = 'critical';

    public static function all(): array
    {
        return [self::LOW, self::MEDIUM, self::HIGH, self::CRITICAL];
    }
}
