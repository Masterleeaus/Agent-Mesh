<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class PlaceSearchPage
{
    public function __construct(
        public array $places,
        public ?string $nextPageToken = null,
        public ?ProviderUsage $usage = null,
    ) {}
}
