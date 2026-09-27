<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class RoutePlanStop extends CompanyScopedModel
{
    protected $table = 'maps_route_plan_stops';
    protected $fillable = [
        'company_id','route_plan_id','sequence','original_sequence','stop_type','label','reference_type','public_reference_id',
        'latitude','longitude','service_duration_seconds','window_start','window_end','locked','status','completed_at','metadata',
    ];
    protected function casts(): array
    {
        return [
            'sequence'=>'integer','original_sequence'=>'integer','latitude'=>'float','longitude'=>'float',
            'service_duration_seconds'=>'integer','window_start'=>'immutable_datetime','window_end'=>'immutable_datetime',
            'locked'=>'boolean','completed_at'=>'immutable_datetime','metadata'=>'array',
        ];
    }
    public function plan(): BelongsTo { return $this->belongsTo(RoutePlan::class,'route_plan_id'); }
}
