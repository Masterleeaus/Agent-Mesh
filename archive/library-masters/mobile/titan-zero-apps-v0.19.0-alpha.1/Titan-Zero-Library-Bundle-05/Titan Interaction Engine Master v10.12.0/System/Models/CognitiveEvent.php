<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Models;

use Illuminate\Database\Eloquent\Model;

final class CognitiveEvent extends Model
{
    protected $table = 'interaction_cognitive_events';
    protected $primaryKey = 'event_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'event_id', 'event_type', 'company_id', 'company_id', 'team_id', 'user_id', 'device_id',
        'subject_type', 'subject_id', 'interaction_run_id', 'wizard_run_id',
        'payload', 'confidence', 'evidence', 'policy_decision', 'model_version',
        'parent_event_id', 'correlation_id', 'privacy_class', 'sequence',
        'occurred_at', 'recorded_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'evidence' => 'array',
        'policy_decision' => 'array',
        'confidence' => 'float',
        'sequence' => 'integer',
        'occurred_at' => 'immutable_datetime',
        'recorded_at' => 'immutable_datetime',
    ];
}
