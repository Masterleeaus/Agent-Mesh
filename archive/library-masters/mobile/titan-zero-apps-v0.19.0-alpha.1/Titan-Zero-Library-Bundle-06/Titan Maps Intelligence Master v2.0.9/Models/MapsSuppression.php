<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class MapsSuppression extends CompanyScopedModel
{
    protected $table = 'maps_suppressions';

    protected $fillable = [
        'company_id',
        'branch_id',
        'workspace_id',
        'suppression_type',
        'normalised_value',
        'reason',
        'created_by_user_id',
        'expires_at'
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'immutable_datetime'
        ];
    }
}
