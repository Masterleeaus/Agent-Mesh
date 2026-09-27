<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Models;

use Illuminate\Database\Eloquent\Model;

class InteractionEvent extends Model
{
    protected $table = 'interaction_events';

    protected $fillable = [
        'company_id',
        'run_id',
        'event_type',
        'data',
        'occurred_at',
    ];

    protected $casts = [
        'data' => 'array',
        'occurred_at' => 'datetime',
    ];
}
