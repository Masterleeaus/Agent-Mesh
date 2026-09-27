<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Models;

use Illuminate\Database\Eloquent\Model;

class QueuedCommand extends Model
{
    protected $table = 'interaction_queued_commands';

    protected $fillable = [
        'company_id',
        'capability',
        'payload',
        'metadata',
        'status',
        'attempts',
        'error',
        'created_at',
        'synced_at',
        'failed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'metadata' => 'array',
        'attempts' => 'integer',
        'created_at' => 'datetime',
        'synced_at' => 'datetime',
        'failed_at' => 'datetime',
    ];
}
