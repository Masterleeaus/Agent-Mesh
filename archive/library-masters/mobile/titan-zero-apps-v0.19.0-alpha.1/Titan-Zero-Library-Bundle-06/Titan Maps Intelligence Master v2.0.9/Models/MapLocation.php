<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class MapLocation extends CompanyScopedModel
{
    protected $table = 'map_locations';

    protected $fillable = [
        'company_id',
        'branch_id',
        'workspace_id',
        'reference_type',
        'public_reference_id',
        'latitude',
        'longitude',
        'source',
        'precision',
        'provider',
        'provider_place_id',
        'address_fingerprint',
        'formatted_address',
        'geocode_confidence',
        'geocode_version',
        'reverse_geocode_metadata',
        'coordinates_verified_at',
        'geocoded_at',
        'reverse_geocoded_at',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'reverse_geocode_metadata' => 'array',
            'coordinates_verified_at' => 'immutable_datetime',
            'geocoded_at' => 'immutable_datetime',
            'reverse_geocoded_at' => 'immutable_datetime',
        ];
    }
}
