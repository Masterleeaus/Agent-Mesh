<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CandidatePromotion extends CompanyScopedModel
{
    protected $table = 'candidate_promotions';

    protected $fillable = [
        'company_id',
        'branch_id',
        'workspace_id',
        'candidate_id',
        'target_workcore_service',
        'target_entity_type',
        'target_entity_id',
        'requested_by_user_id',
        'approved_by_user_id',
        'agent_id',
        'conversation_id',
        'accepted_fields',
        'rejected_fields',
        'reason',
        'workcore_command_id',
        'workcore_event_id',
        'promoted_at'
    ];

    protected function casts(): array
    {
        return [
            'accepted_fields' => 'array',
        'rejected_fields' => 'array',
        'promoted_at' => 'immutable_datetime'
        ];
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(DiscoveryCandidate::class, 'candidate_id');
    }
}
