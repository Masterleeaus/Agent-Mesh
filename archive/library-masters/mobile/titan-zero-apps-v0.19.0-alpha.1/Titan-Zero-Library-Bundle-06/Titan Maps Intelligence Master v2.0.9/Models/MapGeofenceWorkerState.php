<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class MapGeofenceWorkerState extends CompanyScopedModel
{
    protected $table = 'maps_geofence_worker_states';

    protected $fillable = [
        'company_id','branch_id','workspace_id','geofence_id','worker_public_id','is_inside','candidate_state',
        'candidate_samples','candidate_started_at','entered_at','last_evaluated_at','last_dwell_event_at','last_location_ping_id',
    ];

    protected function casts(): array
    {
        return [
            'is_inside' => 'boolean',
            'candidate_samples' => 'integer',
            'candidate_started_at' => 'immutable_datetime',
            'entered_at' => 'immutable_datetime',
            'last_evaluated_at' => 'immutable_datetime',
            'last_dwell_event_at' => 'immutable_datetime',
        ];
    }
}
