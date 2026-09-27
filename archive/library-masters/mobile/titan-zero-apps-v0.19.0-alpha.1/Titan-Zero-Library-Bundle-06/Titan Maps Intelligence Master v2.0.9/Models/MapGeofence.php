<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class MapGeofence extends CompanyScopedModel
{
    protected $table = 'maps_geofences';

    protected $fillable = [
        'company_id','branch_id','workspace_id','name','description','shape_type','center_latitude','center_longitude',
        'radius_metres','geometry','reference_type','public_reference_id','enabled','arrival_confirmation_required',
        'departure_confirmation_required','dwell_seconds','hysteresis_metres','transition_samples','created_by_user_id','updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'center_latitude' => 'float',
            'center_longitude' => 'float',
            'radius_metres' => 'float',
            'geometry' => 'array',
            'enabled' => 'boolean',
            'arrival_confirmation_required' => 'boolean',
            'departure_confirmation_required' => 'boolean',
            'dwell_seconds' => 'integer',
            'hysteresis_metres' => 'float',
            'transition_samples' => 'integer',
        ];
    }
}
