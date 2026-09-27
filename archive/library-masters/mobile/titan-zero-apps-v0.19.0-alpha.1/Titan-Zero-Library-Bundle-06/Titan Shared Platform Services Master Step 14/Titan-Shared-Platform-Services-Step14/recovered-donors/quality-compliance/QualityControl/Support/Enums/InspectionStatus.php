<?php

namespace Modules\QualityControl\Support\Enums;

/**
 * Canonical inspection / QC status enum.
 * Source-of-truth for status values across the QC verification engine.
 * Inspection module references this via the bridge alias.
 */
final class InspectionStatus
{
    public const PENDING        = 'pending';
    public const IN_PROGRESS    = 'in_progress';
    public const PASSED         = 'passed';
    public const FAILED         = 'failed';
    public const RECLEAN_BOOKED = 'reclean_booked';

    // QC-native extension statuses (post-inspection lifecycle)
    public const RECLEAN_REQUIRED = 'reclean_required';
    public const RECLEAN_DONE     = 'reclean_done';
    public const CLOSED           = 'closed';

    public static function all(): array
    {
        return [
            self::PENDING,
            self::IN_PROGRESS,
            self::PASSED,
            self::FAILED,
            self::RECLEAN_BOOKED,
            self::RECLEAN_REQUIRED,
            self::RECLEAN_DONE,
            self::CLOSED,
        ];
    }

    public static function label(string $status): string
    {
        return match ($status) {
            self::PENDING          => 'Pending',
            self::IN_PROGRESS      => 'In Progress',
            self::PASSED           => 'Passed',
            self::FAILED           => 'Failed',
            self::RECLEAN_BOOKED   => 'Re-clean Booked',
            self::RECLEAN_REQUIRED => 'Re-clean Required',
            self::RECLEAN_DONE     => 'Re-clean Done',
            self::CLOSED           => 'Closed',
            default                => ucfirst(str_replace('_', ' ', $status)),
        };
    }

    public static function badgeClass(string $status): string
    {
        return match ($status) {
            self::PENDING          => 'badge-secondary',
            self::IN_PROGRESS      => 'badge-info',
            self::PASSED           => 'badge-success',
            self::FAILED           => 'badge-danger',
            self::RECLEAN_BOOKED   => 'badge-warning',
            self::RECLEAN_REQUIRED => 'badge-warning',
            self::RECLEAN_DONE     => 'badge-primary',
            self::CLOSED           => 'badge-dark',
            default                => 'badge-light',
        };
    }

    /**
     * Map Inspection module legacy statuses to QC canonical values.
     */
    public static function fromLegacy(string $legacyStatus): string
    {
        return match ($legacyStatus) {
            'reclean_booked' => self::RECLEAN_BOOKED,
            'reclean_required', 'needs_reclean' => self::RECLEAN_REQUIRED,
            'reclean_done', 'recleaned' => self::RECLEAN_DONE,
            'pass', 'passed', 'approved' => self::PASSED,
            'fail', 'failed', 'rejected' => self::FAILED,
            'in_progress', 'in-progress' => self::IN_PROGRESS,
            'closed', 'complete', 'completed' => self::CLOSED,
            default => self::PENDING,
        };
    }
}
