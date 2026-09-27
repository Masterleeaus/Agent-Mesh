<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Models;

use Illuminate\Database\Eloquent\Model;

final class LocalIntelligenceMemory extends Model
{
    protected $table = 'local_intelligence_memories';

    protected $fillable = [
        'company_id',
        'company_id', 'user_id', 'device_id', 'memory_type', 'memory_key', 'value',
        'confidence', 'frequency', 'last_observed_at', 'expires_at',
    ];

    protected $casts = [
        'value' => 'array',
        'confidence' => 'float',
        'frequency' => 'integer',
        'last_observed_at' => 'datetime',
        'expires_at' => 'datetime',
    ];
}
