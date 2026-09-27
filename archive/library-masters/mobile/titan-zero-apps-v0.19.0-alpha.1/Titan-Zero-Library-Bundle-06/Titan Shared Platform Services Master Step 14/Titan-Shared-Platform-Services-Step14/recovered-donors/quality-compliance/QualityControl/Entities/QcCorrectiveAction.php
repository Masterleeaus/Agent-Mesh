<?php

namespace Modules\QualityControl\Entities;

use Illuminate\Database\Eloquent\Model;

class QcCorrectiveAction extends Model
{
    protected $table = 'qc_corrective_actions';

    protected $fillable = [
        'company_id',
        'qc_record_id',
        'complaint_id',
        'owner_id',
        'title',
        'description',
        'status',
        'severity_level',
        'due_date',
        'verified_at',
        'verified_by',
    ];

    protected $casts = [
        'due_date' => 'date',
        'verified_at' => 'datetime',
    ];
}
