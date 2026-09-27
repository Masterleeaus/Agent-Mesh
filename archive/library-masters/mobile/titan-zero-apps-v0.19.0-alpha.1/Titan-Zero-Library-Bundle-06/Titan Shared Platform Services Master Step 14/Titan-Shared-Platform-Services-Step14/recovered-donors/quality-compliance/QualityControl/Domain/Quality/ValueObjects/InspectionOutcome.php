<?php

namespace Modules\QualityControl\Domain\Quality\ValueObjects;

final class InspectionOutcome
{
    public const PENDING = 'pending';
    public const PASS = 'pass';
    public const FAIL = 'fail';
    public const NEEDS_RECLEAN = 'needs_reclean';
    public const ESCALATED = 'escalated';

    public static function all(): array
    {
        return [self::PENDING, self::PASS, self::FAIL, self::NEEDS_RECLEAN, self::ESCALATED];
    }
}
