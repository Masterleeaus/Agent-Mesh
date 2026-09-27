<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class MapProviderQuotaPolicy extends CompanyScopedModel
{
    protected $table = 'maps_provider_quota_policies';

    protected $fillable = [
        'company_id','provider','daily_request_limit','monthly_request_limit','soft_limit_percent',
        'override_until','override_reason','overridden_by_user_id','enabled','metadata',
    ];

    protected function casts(): array
    {
        return ['daily_request_limit'=>'integer','monthly_request_limit'=>'integer','soft_limit_percent'=>'integer','override_until'=>'immutable_datetime','enabled'=>'boolean','metadata'=>'array'];
    }
}
