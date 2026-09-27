<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class MapsUsageRecord extends CompanyScopedModel
{
    protected $table = 'maps_usage_records';

    protected $fillable = [
        'company_id',
        'branch_id',
        'workspace_id',
        'provider',
        'operation',
        'request_count',
        'result_count',
        'billable_units',
        'estimated_cost',
        'currency',
        'discovery_search_id',
        'user_id',
        'agent_id',
        'recorded_at'
    ];

    protected function casts(): array
    {
        return [
            'billable_units' => 'float',
        'estimated_cost' => 'float',
        'recorded_at' => 'immutable_datetime'
        ];
    }
}
