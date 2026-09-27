<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Services;

class TrustEvaluator
{
    /**
     * Compute trust level and flags based on GPS attendance + accuracy.
     */
    public static function evaluate(?float $lat, ?float $lng, ?float $accuracyM, ?string $source = null): array
    {
        $flags = [];

        if ($lat === null || $lng === null) {
            $flags[] = 'no_gps';
        }

        if ($accuracyM !== null) {
            if ($accuracyM > 100) $flags[] = 'low_accuracy';
            if ($accuracyM > 500) $flags[] = 'very_low_accuracy';
        } else {
            $flags[] = 'no_accuracy';
        }

        if ($source && $source !== 'device') {
            $flags[] = 'non_device_source';
        }

        // Determine trust level
        if (in_array('no_gps', $flags, true)) {
            $level = 'low';
        } elseif (in_array('very_low_accuracy', $flags, true)) {
            $level = 'low';
        } elseif (in_array('low_accuracy', $flags, true)) {
            $level = 'medium';
        } else {
            $level = 'high';
        }

        return [$level, $flags];
    }
}
