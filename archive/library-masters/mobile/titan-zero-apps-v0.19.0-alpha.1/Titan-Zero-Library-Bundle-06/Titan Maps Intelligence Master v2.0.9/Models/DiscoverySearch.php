<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

final class DiscoverySearch extends CompanyScopedModel
{
    protected $table = 'discovery_searches';

    protected $fillable = [
        'company_id',
        'branch_id',
        'workspace_id',
        'requested_by_user_id',
        'conversation_id',
        'purpose',
        'query',
        'category',
        'categories',
        'address',
        'latitude',
        'longitude',
        'radius_metres',
        'north_boundary',
        'south_boundary',
        'east_boundary',
        'west_boundary',
        'language',
        'country',
        'filters',
        'provider_strategy',
        'maximum_results',
        'status',
        'started_at',
        'completed_at',
        'cancelled_at'
    ];

    protected function casts(): array
    {
        return [
            'categories' => 'array',
        'filters' => 'array',
        'provider_strategy' => 'array',
        'latitude' => 'float',
        'longitude' => 'float',
        'started_at' => 'immutable_datetime',
        'completed_at' => 'immutable_datetime',
        'cancelled_at' => 'immutable_datetime'
        ];
    }

    public function runs(): HasMany
    {
        return $this->hasMany(DiscoveryRun::class, 'discovery_search_id');
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(DiscoveryCandidate::class, 'discovery_search_id');
    }
}
