<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

final class ExternalPlace extends CompanyScopedModel
{
    protected $table = 'external_places';

    protected $fillable = [
        'company_id',
        'branch_id',
        'workspace_id',
        'provider',
        'provider_place_id',
        'canonical_key',
        'name',
        'legal_name',
        'description',
        'categories',
        'primary_category',
        'address',
        'suburb',
        'state',
        'postcode',
        'country',
        'latitude',
        'longitude',
        'phone',
        'website',
        'public_email',
        'opening_hours',
        'currently_open',
        'temporarily_closed',
        'permanently_closed',
        'rating',
        'review_count',
        'price_level',
        'source_url',
        'raw_payload_reference',
        'raw_payload_hash',
        'first_observed_at',
        'last_observed_at',
        'last_verified_at',
        'confidence',
        'data_freshness',
        'provider_terms_metadata'
    ];

    protected function casts(): array
    {
        return [
            'categories' => 'array',
        'opening_hours' => 'array',
        'provider_terms_metadata' => 'array',
        'currently_open' => 'boolean',
        'temporarily_closed' => 'boolean',
        'permanently_closed' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
        'rating' => 'float',
        'confidence' => 'float',
        'first_observed_at' => 'immutable_datetime',
        'last_observed_at' => 'immutable_datetime',
        'last_verified_at' => 'immutable_datetime'
        ];
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(ExternalPlaceContact::class, 'external_place_id');
    }

    public function observations(): HasMany
    {
        return $this->hasMany(FieldObservation::class, 'external_place_id');
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(DiscoveryCandidate::class, 'external_place_id');
    }
}
