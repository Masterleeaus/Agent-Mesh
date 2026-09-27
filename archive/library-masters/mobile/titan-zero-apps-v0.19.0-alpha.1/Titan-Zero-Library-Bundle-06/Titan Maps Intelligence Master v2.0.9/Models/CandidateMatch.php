<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CandidateMatch extends CompanyScopedModel
{
    protected $table = 'candidate_matches';

    protected $fillable = [
        'company_id',
        'branch_id',
        'workspace_id',
        'candidate_id',
        'workcore_entity_type',
        'workcore_entity_id',
        'match_score',
        'matching_fields',
        'conflicting_fields',
        'match_strategy',
        'human_review_status',
        'resolution'
    ];

    protected function casts(): array
    {
        return [
            'match_score' => 'float',
        'matching_fields' => 'array',
        'conflicting_fields' => 'array'
        ];
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(DiscoveryCandidate::class, 'candidate_id');
    }
}
