<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class ProviderCapabilities
{
    public function __construct(
        public bool $textSearch,
        public bool $nearbySearch,
        public bool $placeDetails,
        public bool $pagination,
        public array $supportedFilters = [],
        public array $storageRestrictions = [],
    ) {}
}
