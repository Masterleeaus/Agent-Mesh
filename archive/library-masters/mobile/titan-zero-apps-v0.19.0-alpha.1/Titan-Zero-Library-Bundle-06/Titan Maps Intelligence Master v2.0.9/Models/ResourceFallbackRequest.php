<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class ResourceFallbackRequest extends CompanyScopedModel
{
    protected $table = 'maps_resource_fallback_requests';
    protected $fillable = [
        'company_id','branch_id','workspace_id','resource_type','operational_need_type','operational_need_public_id','job_public_id','service_key','query','target_latitude','target_longitude',
        'radius_metres','travel_mode','routing_preference','open_now','status','internal_check_status','internal_evidence','approved_network_status',
        'approved_network_evidence','discovery_search_id','selected_candidate_id','requested_by_user_id','refreshed_at','review_due_at','escalated_at','closed_at','metadata',
    ];
    protected function casts(): array
    {
        return [
            'target_latitude'=>'float','target_longitude'=>'float','radius_metres'=>'float','open_now'=>'boolean','internal_evidence'=>'array','approved_network_evidence'=>'array',
            'refreshed_at'=>'immutable_datetime','review_due_at'=>'immutable_datetime','escalated_at'=>'immutable_datetime','closed_at'=>'immutable_datetime','metadata'=>'array',
        ];
    }
    public function candidates(): HasMany { return $this->hasMany(ResourceFallbackCandidate::class,'fallback_request_id')->orderBy('rank'); }
    public function decisions(): HasMany { return $this->hasMany(ResourceFallbackDecision::class,'fallback_request_id')->orderByDesc('decided_at'); }
    public function discoverySearch(): BelongsTo { return $this->belongsTo(DiscoverySearch::class,'discovery_search_id'); }
}
