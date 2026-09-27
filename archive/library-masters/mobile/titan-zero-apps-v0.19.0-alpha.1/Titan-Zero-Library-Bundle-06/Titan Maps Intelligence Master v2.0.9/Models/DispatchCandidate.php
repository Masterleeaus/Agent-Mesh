<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DispatchCandidate extends CompanyScopedModel
{
    protected $table = 'maps_dispatch_candidates';
    protected $fillable=['company_id','dispatch_recommendation_id','worker_public_id','worker_user_id','rank','eligible','blocked','total_score','latitude','longitude','road_distance_metres','straight_line_distance_metres','duration_seconds','traffic_delay_seconds','eta_basis','matrix_condition','dimensions','evidence','blockers','explanations','metadata'];
    protected function casts(): array { return ['rank'=>'integer','eligible'=>'boolean','blocked'=>'boolean','total_score'=>'float','latitude'=>'float','longitude'=>'float','road_distance_metres'=>'integer','straight_line_distance_metres'=>'integer','duration_seconds'=>'integer','traffic_delay_seconds'=>'integer','dimensions'=>'array','evidence'=>'array','blockers'=>'array','explanations'=>'array','metadata'=>'array']; }
    public function recommendation(): BelongsTo { return $this->belongsTo(DispatchRecommendation::class,'dispatch_recommendation_id'); }
}
