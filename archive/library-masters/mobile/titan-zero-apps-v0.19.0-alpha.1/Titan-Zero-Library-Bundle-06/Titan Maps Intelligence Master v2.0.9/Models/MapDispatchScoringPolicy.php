<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class MapDispatchScoringPolicy extends CompanyScopedModel
{
    protected $table = 'maps_dispatch_scoring_policies';

    protected $fillable = [
        'company_id','vertical','policy_version','weights','temporal_settings','enabled','updated_by_user_id','metadata',
    ];

    protected function casts(): array
    {
        return ['weights'=>'array','temporal_settings'=>'array','enabled'=>'boolean','metadata'=>'array'];
    }
}
