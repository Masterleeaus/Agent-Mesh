<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DiscoveryCandidate extends CompanyScopedModel
{
    protected $table = 'discovery_candidates';

    protected $fillable = [
        'company_id',
        'branch_id',
        'workspace_id',
        'discovery_search_id',
        'external_place_id',
        'candidate_type',
        'lifecycle_status',
        'relevance_score',
        'confidence_score',
        'classification_evidence',
        'assigned_user_id',
        'assigned_agent_id',
        'existing_workcore_entity_type',
        'existing_workcore_entity_id',
        'review_status',
        'unresolved_match',
        'approved_at',
        'rejected_at',
        'rejection_reason'
    ];

    protected function casts(): array
    {
        return [
            'classification_evidence' => 'array',
        'relevance_score' => 'float',
        'confidence_score' => 'float',
        'unresolved_match' => 'boolean',
        'approved_at' => 'immutable_datetime',
        'rejected_at' => 'immutable_datetime'
        ];
    }
    public function place(): BelongsTo
    {
        return $this->belongsTo(ExternalPlace::class, 'external_place_id');
    }
}
