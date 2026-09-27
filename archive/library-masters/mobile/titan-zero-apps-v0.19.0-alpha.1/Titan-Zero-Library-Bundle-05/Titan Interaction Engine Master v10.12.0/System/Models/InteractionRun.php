<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Models;

use Illuminate\Database\Eloquent\Model;

class InteractionRun extends Model
{
    protected $table = 'interaction_runs';

    protected $fillable = [
        'company_id',
        'user_id',
        'interaction_id',
        'definition_version',
        'current_section_index',
        'answers',
        'state',
        'meta',
        'completed_at',
    ];

    protected $casts = [
        'answers' => 'array',
        'meta' => 'array',
        'completed_at' => 'datetime',
    ];

    public function answers()
    {
        return $this->hasMany(InteractionAnswer::class);
    }
}
