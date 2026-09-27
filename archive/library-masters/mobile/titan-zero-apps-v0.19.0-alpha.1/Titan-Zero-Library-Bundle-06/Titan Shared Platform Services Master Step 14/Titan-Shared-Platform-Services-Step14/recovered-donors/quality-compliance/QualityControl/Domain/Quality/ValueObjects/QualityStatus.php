<?php

namespace Modules\QualityControl\Domain\Quality\ValueObjects;

final class QualityStatus
{
    public const PENDING = 'pending';
    public const PASS = 'pass';
    public const FAIL = 'fail';
    public const RECLEAN_REQUIRED = 'reclean_required';
    public const RECLEAN_DONE = 'reclean_done';
    public const CLOSED = 'closed';

    public static function all(): array
    {
        return [
            self::PENDING,
            self::PASS,
            self::FAIL,
            self::RECLEAN_REQUIRED,
            self::RECLEAN_DONE,
            self::CLOSED,
        ];
    }
}
