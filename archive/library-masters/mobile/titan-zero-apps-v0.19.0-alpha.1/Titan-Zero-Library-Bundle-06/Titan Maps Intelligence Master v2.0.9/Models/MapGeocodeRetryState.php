<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class MapGeocodeRetryState extends CompanyScopedModel
{
    protected $table = 'maps_geocode_retry_states';

    protected $fillable = [
        'company_id','reference_type','public_reference_id','address_fingerprint',
        'retry_count','last_geocode_attempt','next_geocode_attempt','last_error_code','blocked_at',
    ];

    protected function casts(): array
    {
        return [
            'retry_count'=>'integer',
            'last_geocode_attempt'=>'immutable_datetime',
            'next_geocode_attempt'=>'immutable_datetime',
            'blocked_at'=>'immutable_datetime',
        ];
    }
}
