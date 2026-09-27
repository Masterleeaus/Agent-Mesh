<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class MapGeofenceEvent extends CompanyScopedModel
{
    protected $table = 'maps_geofence_events';

    protected $fillable = [
        'company_id','branch_id','workspace_id','geofence_id','worker_public_id','location_ping_id','event_type',
        'reference_type','public_reference_id','requires_confirmation','confirmation_status','confirmed_by_user_id',
        'confirmed_at','occurred_at','idempotency_key','confidence_percent','metadata',
    ];

    protected function casts(): array
    {
        return [
            'requires_confirmation' => 'boolean',
            'confirmed_at' => 'immutable_datetime',
            'occurred_at' => 'immutable_datetime',
            'confidence_percent' => 'float',
            'metadata' => 'array',
        ];
    }
}
