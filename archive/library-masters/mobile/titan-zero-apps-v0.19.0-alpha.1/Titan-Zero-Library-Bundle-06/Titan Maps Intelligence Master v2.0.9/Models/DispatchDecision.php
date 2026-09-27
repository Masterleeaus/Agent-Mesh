<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DispatchDecision extends CompanyScopedModel
{
    protected $table = 'maps_dispatch_decisions';
    protected $fillable=['company_id','dispatch_recommendation_id','dispatch_candidate_id','decision','worker_public_id','worker_user_id','assignment_requested','assignment_status','assignment_reference','reason','decided_by_user_id','decided_at','result'];
    protected function casts(): array { return ['assignment_requested'=>'boolean','decided_at'=>'immutable_datetime','result'=>'array']; }
    public function recommendation(): BelongsTo { return $this->belongsTo(DispatchRecommendation::class,'dispatch_recommendation_id'); }
    public function candidate(): BelongsTo { return $this->belongsTo(DispatchCandidate::class,'dispatch_candidate_id'); }
}
