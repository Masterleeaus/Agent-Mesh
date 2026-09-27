<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class MapLocationPing extends CompanyScopedModel
{
    protected $table = 'maps_location_pings';

    protected $fillable = [
        'company_id','branch_id','workspace_id','worker_public_id','user_id','latitude','longitude',
        'accuracy_metres','altitude_metres','speed_metres_per_second','heading_degrees','motion_metadata',
        'captured_at','received_at','dedupe_key','client_sample_id','device_id_hash','offline_sync','retention_expires_at','offline_classification','geofence_eligible',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'accuracy_metres' => 'float',
            'altitude_metres' => 'float',
            'speed_metres_per_second' => 'float',
            'heading_degrees' => 'float',
            'motion_metadata' => 'array',
            'captured_at' => 'immutable_datetime',
            'received_at' => 'immutable_datetime',
            'offline_sync' => 'boolean',
            'retention_expires_at' => 'immutable_datetime',
            'geofence_eligible' => 'boolean',
        ];
    }
}
