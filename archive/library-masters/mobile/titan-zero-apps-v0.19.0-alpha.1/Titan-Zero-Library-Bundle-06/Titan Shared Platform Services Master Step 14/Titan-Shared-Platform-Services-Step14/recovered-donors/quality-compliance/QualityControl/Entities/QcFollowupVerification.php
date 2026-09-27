<?php

namespace Modules\QualityControl\Entities;

use Illuminate\Database\Eloquent\Model;

class QcFollowupVerification extends Model
{
    protected $table = 'qc_followup_verifications';

    protected $fillable = [
        'company_id',
        'qc_record_id',
        'schedule_id',
        'complaint_id',
        'assigned_to',
        'status',
        'due_at',
        'verified_at',
        'verified_by',
        'notes',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'verified_at' => 'datetime',
    ];
}
