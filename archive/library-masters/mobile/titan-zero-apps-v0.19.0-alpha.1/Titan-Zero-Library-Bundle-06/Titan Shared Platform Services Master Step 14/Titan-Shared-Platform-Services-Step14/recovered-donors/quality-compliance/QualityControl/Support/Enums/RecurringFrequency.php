<?php

namespace Modules\QualityControl\Support\Enums;

/**
 * Canonical recurring-schedule frequency enum.
 * Source-of-truth for rotation/frequency values used by the QC scheduling engine.
 * These values must match the `rotation` column enum in `inspection_schedule_recurring`.
 */
final class RecurringFrequency
{
    public const DAILY       = 'daily';
    public const WEEKLY      = 'weekly';
    public const BI_WEEKLY   = 'bi-weekly';
    public const MONTHLY     = 'monthly';
    public const QUARTERLY   = 'quarterly';
    public const HALF_YEARLY = 'half-yearly';
    public const ANNUALLY    = 'annually';

    public static function all(): array
    {
        return [
            self::DAILY,
            self::WEEKLY,
            self::BI_WEEKLY,
            self::MONTHLY,
            self::QUARTERLY,
            self::HALF_YEARLY,
            self::ANNUALLY,
        ];
    }

    public static function label(string $frequency): string
    {
        return match ($frequency) {
            self::DAILY       => 'Daily',
            self::WEEKLY      => 'Weekly',
            self::BI_WEEKLY   => 'Bi-Weekly',
            self::MONTHLY     => 'Monthly',
            self::QUARTERLY   => 'Quarterly',
            self::HALF_YEARLY => 'Half-Yearly',
            self::ANNUALLY    => 'Annually',
            default           => ucfirst(str_replace('-', ' ', $frequency)),
        };
    }

    public static function badgeClass(string $frequency): string
    {
        return match ($frequency) {
            self::DAILY       => 'badge-success',
            self::WEEKLY      => 'badge-info',
            self::BI_WEEKLY   => 'badge-warning',
            self::MONTHLY     => 'badge-secondary',
            self::QUARTERLY   => 'badge-light',
            self::HALF_YEARLY => 'badge-dark',
            self::ANNUALLY    => 'badge-primary',
            default           => 'badge-light',
        };
    }
}
