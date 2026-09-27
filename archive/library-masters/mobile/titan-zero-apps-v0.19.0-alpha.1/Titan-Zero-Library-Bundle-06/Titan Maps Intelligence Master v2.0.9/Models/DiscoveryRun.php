<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class DiscoveryRun extends CompanyScopedModel
{
    protected $table = 'discovery_runs';

    protected $fillable = [
        'company_id',
        'branch_id',
        'workspace_id',
        'discovery_search_id',
        'provider',
        'cursor',
        'current_stage',
        'attempts',
        'results_discovered',
        'results_processed',
        'results_skipped',
        'duplicates_detected',
        'failures',
        'rate_limit_state',
        'retry_after',
        'checkpoint',
        'started_at',
        'completed_at',
        'failure_code',
        'safe_failure_details'
    ];

    protected function casts(): array
    {
        return [
            'rate_limit_state' => 'array',
        'checkpoint' => 'array',
        'retry_after' => 'immutable_datetime',
        'started_at' => 'immutable_datetime',
        'completed_at' => 'immutable_datetime'
        ];
    }
}
