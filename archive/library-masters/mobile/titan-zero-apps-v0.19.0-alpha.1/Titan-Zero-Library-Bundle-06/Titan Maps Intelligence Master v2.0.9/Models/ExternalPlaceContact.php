<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class ExternalPlaceContact extends CompanyScopedModel
{
    protected $table = 'external_place_contacts';

    protected $fillable = [
        'company_id',
        'branch_id',
        'workspace_id',
        'external_place_id',
        'contact_type',
        'normalised_value',
        'display_value',
        'source_provider',
        'source_url',
        'verification_status',
        'verification_method',
        'confidence',
        'first_observed_at',
        'last_observed_at'
    ];

    protected function casts(): array
    {
        return [
            'confidence' => 'float',
        'first_observed_at' => 'immutable_datetime',
        'last_observed_at' => 'immutable_datetime'
        ];
    }
}
