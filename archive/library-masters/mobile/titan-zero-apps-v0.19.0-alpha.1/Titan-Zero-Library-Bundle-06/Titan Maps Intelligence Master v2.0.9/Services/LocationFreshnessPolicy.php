<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use DateInterval;
use DateTimeImmutable;
use DateTimeInterface;

final class LocationFreshnessPolicy
{
    public function __construct(private readonly MapsConfiguration $configuration) {}

    public function isStale(string $source, ?DateTimeInterface $verifiedAt, ?DateTimeInterface $now = null): bool
    {
        if ($verifiedAt === null) {
            return true;
        }

        $now = $now === null
            ? new DateTimeImmutable('now')
            : DateTimeImmutable::createFromInterface($now);
        $verified = DateTimeImmutable::createFromInterface($verifiedAt);

        $interval = match ($source) {
            'gps' => new DateInterval('PT'.$this->configuration->gpsLocationTtlMinutes().'M'),
            'manual' => new DateInterval('P'.$this->configuration->manualLocationTtlDays().'D'),
            default => new DateInterval('P'.$this->configuration->geocodeLocationTtlDays().'D'),
        };

        return $verified->add($interval) <= $now;
    }
}
