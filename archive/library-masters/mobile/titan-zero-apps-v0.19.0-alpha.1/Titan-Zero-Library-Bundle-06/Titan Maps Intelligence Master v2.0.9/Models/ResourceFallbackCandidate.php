<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ResourceFallbackCandidate extends CompanyScopedModel
{
    protected $table = 'maps_resource_fallback_candidates';
    protected $fillable = [
        'company_id','fallback_request_id','source','resource_type','source_reference_type','source_public_id','discovery_candidate_id','label','subtitle',
        'latitude','longitude','service_match','service_evidence','road_distance_metres','straight_line_distance_metres','duration_seconds','traffic_delay_seconds',
        'eta_basis','matrix_condition','fit_score','rank','status','evidence','explanations','reviewed_by_user_id','reviewed_at','approved_at','rejected_at',
        'promoted_at','promotion_target_entity_id','metadata',
    ];
    protected function casts(): array
    {
        return [
            'latitude'=>'float','longitude'=>'float','service_match'=>'float','road_distance_metres'=>'integer','straight_line_distance_metres'=>'integer',
            'duration_seconds'=>'integer','traffic_delay_seconds'=>'integer','fit_score'=>'float','rank'=>'integer','evidence'=>'array','explanations'=>'array',
            'reviewed_at'=>'immutable_datetime','approved_at'=>'immutable_datetime','rejected_at'=>'immutable_datetime','promoted_at'=>'immutable_datetime','metadata'=>'array',
        ];
    }
    public function request(): BelongsTo { return $this->belongsTo(ResourceFallbackRequest::class,'fallback_request_id'); }
    public function discoveryCandidate(): BelongsTo { return $this->belongsTo(DiscoveryCandidate::class,'discovery_candidate_id'); }
}
