<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class FieldObservation extends CompanyScopedModel
{
    protected $table = 'field_observations';

    protected $fillable = [
        'company_id',
        'branch_id',
        'workspace_id',
        'external_place_id',
        'field',
        'observed_value',
        'provider',
        'source_url',
        'observed_at',
        'confidence',
        'expires_at',
        'restrictions',
        'observation_type'
    ];

    protected function casts(): array
    {
        return [
            'observed_value' => 'array',
        'restrictions' => 'array',
        'confidence' => 'float',
        'observed_at' => 'immutable_datetime',
        'expires_at' => 'immutable_datetime'
        ];
    }
}
