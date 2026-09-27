<?php

namespace Modules\QualityControl\Support\Enums;

/**
 * Canonical schedule/planning status enum.
 * Source-of-truth for schedule lifecycle values used by both the
 * Inspection (planning) module and the QualityControl (verification) module.
 */
final class ScheduleStatus
{
    public const OPEN     = 'open';
    public const PENDING  = 'pending';
    public const RESOLVED = 'resolved';
    public const CLOSED   = 'closed';

    public static function all(): array
    {
        return [self::OPEN, self::PENDING, self::RESOLVED, self::CLOSED];
    }

    public static function label(string $status): string
    {
        return match ($status) {
            self::OPEN     => 'Open',
            self::PENDING  => 'Pending',
            self::RESOLVED => 'Resolved',
            self::CLOSED   => 'Closed',
            default        => ucfirst(str_replace('_', ' ', $status)),
        };
    }

    public static function badgeClass(string $status): string
    {
        return match ($status) {
            self::OPEN     => 'badge-primary',
            self::PENDING  => 'badge-warning',
            self::RESOLVED => 'badge-success',
            self::CLOSED   => 'badge-secondary',
            default        => 'badge-light',
        };
    }
}
