<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\HasOne;

final class RouteSnapshot extends CompanyScopedModel
{
    protected $table = 'maps_route_snapshots';

    protected $fillable = [
        'company_id','branch_id','workspace_id','request_signature',
        'origin_latitude','origin_longitude','destination_latitude','destination_longitude',
        'travel_mode','routing_preference','provider','result_basis','source_snapshot_id',
        'road_distance_metres','straight_line_distance_metres','encoded_polyline',
        'provider_error_code','worker_public_id','customer_public_id','origin_reference_type','origin_public_reference_id','destination_reference_type','destination_public_reference_id','metadata','calculated_at','stale_at','created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'origin_latitude' => 'float','origin_longitude' => 'float',
            'destination_latitude' => 'float','destination_longitude' => 'float',
            'road_distance_metres' => 'integer','straight_line_distance_metres' => 'integer',
            'metadata' => 'array','calculated_at' => 'immutable_datetime','stale_at' => 'immutable_datetime',
        ];
    }

    public function eta(): HasOne
    {
        return $this->hasOne(EtaSnapshot::class, 'route_snapshot_id');
    }
}
