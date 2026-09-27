<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class EtaSnapshot extends CompanyScopedModel
{
    protected $table = 'maps_eta_snapshots';

    protected $fillable = [
        'company_id','route_snapshot_id','provider','result_basis','traffic_basis',
        'duration_seconds','static_duration_seconds','traffic_delay_seconds',
        'calculated_at','stale_at','valid_until','metadata',
    ];

    protected function casts(): array
    {
        return [
            'duration_seconds' => 'integer','static_duration_seconds' => 'integer','traffic_delay_seconds' => 'integer',
            'calculated_at' => 'immutable_datetime','stale_at' => 'immutable_datetime','valid_until' => 'immutable_datetime','metadata' => 'array',
        ];
    }

    public function routeSnapshot(): BelongsTo
    {
        return $this->belongsTo(RouteSnapshot::class, 'route_snapshot_id');
    }
}
