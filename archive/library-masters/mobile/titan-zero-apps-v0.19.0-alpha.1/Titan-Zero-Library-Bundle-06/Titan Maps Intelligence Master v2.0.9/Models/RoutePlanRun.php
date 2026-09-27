<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class RoutePlanRun extends CompanyScopedModel
{
    protected $table = 'maps_route_plan_runs';
    protected $fillable = [
        'company_id','route_plan_id','revision','trigger','matrix_snapshot_id','result_basis','provider','algorithm',
        'baseline_distance_metres','optimised_distance_metres','distance_savings_metres','baseline_duration_seconds',
        'optimised_duration_seconds','duration_savings_seconds','ordered_stop_ids','schedule','window_violations',
        'route_snapshot_ids','geometry_status','metadata','calculated_at','created_by_user_id',
    ];
    protected function casts(): array
    {
        return [
            'revision'=>'integer','baseline_distance_metres'=>'integer','optimised_distance_metres'=>'integer',
            'distance_savings_metres'=>'integer','baseline_duration_seconds'=>'integer','optimised_duration_seconds'=>'integer',
            'duration_savings_seconds'=>'integer','ordered_stop_ids'=>'array','schedule'=>'array','window_violations'=>'array',
            'route_snapshot_ids'=>'array','metadata'=>'array','calculated_at'=>'immutable_datetime',
        ];
    }
    public function plan(): BelongsTo { return $this->belongsTo(RoutePlan::class,'route_plan_id'); }
    public function matrix(): BelongsTo { return $this->belongsTo(TravelMatrixSnapshot::class,'matrix_snapshot_id'); }
}
