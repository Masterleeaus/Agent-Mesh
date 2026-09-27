<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class RoutePlan extends CompanyScopedModel
{
    protected $table = 'maps_route_plans';
    protected $fillable = [
        'company_id','branch_id','workspace_id','name','service_date','worker_public_id','travel_mode',
        'routing_preference','start_at','status','current_run_id','created_by_user_id','updated_by_user_id','metadata',
    ];
    protected function casts(): array
    {
        return ['service_date'=>'date','start_at'=>'immutable_datetime','metadata'=>'array'];
    }
    public function stops(): HasMany { return $this->hasMany(RoutePlanStop::class,'route_plan_id')->orderBy('sequence'); }
    public function runs(): HasMany { return $this->hasMany(RoutePlanRun::class,'route_plan_id')->orderByDesc('revision'); }
    public function currentRun(): BelongsTo { return $this->belongsTo(RoutePlanRun::class,'current_run_id'); }
}
