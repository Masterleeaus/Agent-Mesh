<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class ReverseGeocodeRequest
{
    public function __construct(
        public Coordinates $coordinates,
        public ?string $languageCode = null,
        public ?string $regionCode = null,
    ) {}
}
