<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class GeographicPricingSignal extends CompanyScopedModel
{
    protected $table = 'maps_geographic_pricing_signals';
    protected $fillable = ['company_id','territory_evaluation_id','service_territory_id','signal_type','severity','authoritative','application_status','hint_type','hint_value','currency','evidence','emitted_at'];
    protected function casts(): array { return ['authoritative'=>'boolean','hint_value'=>'float','evidence'=>'array','emitted_at'=>'immutable_datetime']; }
}
