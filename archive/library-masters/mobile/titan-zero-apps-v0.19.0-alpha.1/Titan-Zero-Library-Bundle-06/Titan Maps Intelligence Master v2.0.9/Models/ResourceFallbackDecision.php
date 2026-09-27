<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ResourceFallbackDecision extends CompanyScopedModel
{
    protected $table = 'maps_resource_fallback_decisions';
    protected $fillable = [
        'company_id','fallback_request_id','fallback_candidate_id','decision','promote_requested','reason','decided_by_user_id','decided_at','result',
    ];
    protected function casts(): array
    {
        return ['promote_requested'=>'boolean','decided_at'=>'immutable_datetime','result'=>'array'];
    }
    public function request(): BelongsTo { return $this->belongsTo(ResourceFallbackRequest::class,'fallback_request_id'); }
    public function candidate(): BelongsTo { return $this->belongsTo(ResourceFallbackCandidate::class,'fallback_candidate_id'); }
}
