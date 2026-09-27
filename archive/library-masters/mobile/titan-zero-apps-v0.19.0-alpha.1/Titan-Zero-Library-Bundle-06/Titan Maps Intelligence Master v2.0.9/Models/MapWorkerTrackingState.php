<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class MapWorkerTrackingState extends CompanyScopedModel
{
    protected $table = 'maps_worker_tracking_states';

    protected $fillable = [
        'company_id','branch_id','workspace_id','worker_public_id','user_id','tracking_allowed','on_duty',
        'latest_location_ping_id','latest_captured_at','last_received_at','status_changed_at','share_history_until','device_id_hash',
    ];

    protected function casts(): array
    {
        return [
            'tracking_allowed' => 'boolean',
            'on_duty' => 'boolean',
            'latest_captured_at' => 'immutable_datetime',
            'last_received_at' => 'immutable_datetime',
            'status_changed_at' => 'immutable_datetime',
            'share_history_until' => 'immutable_datetime',
        ];
    }
}
