<?php

declare(strict_types=1);

namespace Tests\Fakes\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\Contracts\GeocodingProvider;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\GeocodeRequest;
use App\Extensions\TitanMapsIntelligence\DTO\GeocodeResult;
use App\Extensions\TitanMapsIntelligence\DTO\ProviderUsage;
use App\Extensions\TitanMapsIntelligence\DTO\ReverseGeocodeRequest;

final class FakeGeocodingProvider implements GeocodingProvider
{
    public function id(): string { return 'fake-geocoding'; }

    public function geocode(GeocodeRequest $request): GeocodeResult
    {
        return new GeocodeResult($this->id(), new Coordinates(-37.8136, 144.9631), $request->address, 'fake-place', 'ROOFTOP', [], new ProviderUsage($this->id(), 'geocode_forward'));
    }

    public function reverseGeocode(ReverseGeocodeRequest $request): GeocodeResult
    {
        return new GeocodeResult($this->id(), $request->coordinates, 'Fake reverse address', 'fake-place', 'ROOFTOP', [], new ProviderUsage($this->id(), 'geocode_reverse'));
    }
}
