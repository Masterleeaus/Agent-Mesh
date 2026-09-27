<?php

namespace Modules\QualityControl\Entities;

use Illuminate\Database\Eloquent\Model;

class QcCorrectiveActionUpdate extends Model
{
    protected $table = 'qc_corrective_action_updates';

    protected $fillable = [
        'company_id',
        'corrective_action_id',
        'updated_by',
        'status',
        'note',
    ];
}
