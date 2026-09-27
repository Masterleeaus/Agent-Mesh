<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class GeocodeResult
{
    public function __construct(
        public string $provider,
        public Coordinates $coordinates,
        public string $formattedAddress,
        public ?string $providerPlaceId,
        public ?string $precision,
        public array $addressComponents,
        public ProviderUsage $usage,
    ) {}
}
