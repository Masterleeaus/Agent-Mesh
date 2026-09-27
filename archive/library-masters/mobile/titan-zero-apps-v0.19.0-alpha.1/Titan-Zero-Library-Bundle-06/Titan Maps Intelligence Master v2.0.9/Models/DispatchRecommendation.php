<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

final class DispatchRecommendation extends CompanyScopedModel
{
    protected $table = 'maps_dispatch_recommendations';
    protected $fillable=['company_id','branch_id','workspace_id','job_public_id','job_type','job_title','priority','target_latitude','target_longitude','scheduled_start','scheduled_end','travel_mode','routing_preference','matrix_snapshot_id','status','recommended_worker_public_id','recommended_worker_user_id','selected_worker_public_id','selected_worker_user_id','scoring_version','weights','job_snapshot','summary','requested_by_user_id','calculated_at','expires_at','metadata'];
    protected function casts(): array { return ['target_latitude'=>'float','target_longitude'=>'float','scheduled_start'=>'immutable_datetime','scheduled_end'=>'immutable_datetime','weights'=>'array','job_snapshot'=>'array','summary'=>'array','calculated_at'=>'immutable_datetime','expires_at'=>'immutable_datetime','metadata'=>'array']; }
    public function candidates(): HasMany { return $this->hasMany(DispatchCandidate::class,'dispatch_recommendation_id')->orderBy('rank'); }
    public function decisions(): HasMany { return $this->hasMany(DispatchDecision::class,'dispatch_recommendation_id')->orderByDesc('decided_at'); }
}
