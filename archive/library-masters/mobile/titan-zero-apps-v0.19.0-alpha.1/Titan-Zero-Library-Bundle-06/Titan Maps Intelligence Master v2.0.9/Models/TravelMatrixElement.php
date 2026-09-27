<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class TravelMatrixElement extends CompanyScopedModel
{
    protected $table = 'maps_travel_matrix_elements';

    protected $fillable = [
        'company_id','matrix_snapshot_id','origin_index','destination_index',
        'origin_reference_type','origin_public_reference_id','destination_reference_type','destination_public_reference_id',
        'origin_latitude','origin_longitude','destination_latitude','destination_longitude',
        'distance_metres','straight_line_distance_metres','duration_seconds','static_duration_seconds','traffic_delay_seconds','condition','metadata',
    ];

    protected function casts(): array
    {
        return [
            'origin_index'=>'integer','destination_index'=>'integer',
            'origin_latitude'=>'float','origin_longitude'=>'float','destination_latitude'=>'float','destination_longitude'=>'float',
            'distance_metres'=>'integer','straight_line_distance_metres'=>'integer','duration_seconds'=>'integer','static_duration_seconds'=>'integer','traffic_delay_seconds'=>'integer',
            'metadata'=>'array',
        ];
    }
}
