<?php

namespace Modules\QualityControl\Domain\Quality\ValueObjects;

final class RecleanLifecycleStatus
{
    public const REQUESTED = 'requested';
    public const SCHEDULED = 'scheduled';
    public const COMPLETED = 'completed';
    public const VERIFIED = 'verified';
    public const FAILED_AGAIN = 'failed_again';
    public const ESCALATED = 'escalated';

    public static function all(): array
    {
        return [
            self::REQUESTED,
            self::SCHEDULED,
            self::COMPLETED,
            self::VERIFIED,
            self::FAILED_AGAIN,
            self::ESCALATED,
        ];
    }
}
