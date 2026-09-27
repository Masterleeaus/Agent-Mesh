<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\GeocodeRequest;
use App\Extensions\TitanMapsIntelligence\DTO\GeocodeResult;
use App\Extensions\TitanMapsIntelligence\DTO\ReverseGeocodeRequest;

interface GeocodingProvider
{
    public function id(): string;
    public function geocode(GeocodeRequest $request): GeocodeResult;
    public function reverseGeocode(ReverseGeocodeRequest $request): GeocodeResult;
}
