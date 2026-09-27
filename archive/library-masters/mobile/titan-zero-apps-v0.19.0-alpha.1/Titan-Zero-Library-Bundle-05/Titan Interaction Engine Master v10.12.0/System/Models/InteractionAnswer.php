<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Models;

use Illuminate\Database\Eloquent\Model;

class InteractionAnswer extends Model
{
    protected $table = 'interaction_answers';

    protected $fillable = [
        'company_id',
        'run_id',
        'question_key',
        'value',
        'source',
        'confidence',
        'answered_at',
        'edited_by_user',
        'edited_by_ai',
        'validation_state',
    ];

    protected $casts = [
        'value' => 'array',
        'confidence' => 'float',
        'answered_at' => 'datetime',
        'edited_by_user' => 'boolean',
        'edited_by_ai' => 'boolean',
    ];
}
