<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

final class TerritoryEvaluation extends CompanyScopedModel
{
    protected $table = 'maps_territory_evaluations';
    protected $fillable = ['company_id','branch_id','workspace_id','target_reference_type','target_public_reference_id','target_latitude','target_longitude','target_suburb','target_postcode','service_key','covered','primary_territory_id','blocked_territory_id','travel_territory_id','branch_public_id','route_snapshot_id','result_basis','road_distance_metres','straight_line_distance_metres','duration_seconds','distance_basis','eta_basis','matched_territories','evidence','evaluated_by_user_id','evaluated_at'];
    protected function casts(): array { return ['target_latitude'=>'float','target_longitude'=>'float','covered'=>'boolean','road_distance_metres'=>'integer','straight_line_distance_metres'=>'integer','duration_seconds'=>'integer','matched_territories'=>'array','evidence'=>'array','evaluated_at'=>'immutable_datetime']; }
    public function signals(): HasMany { return $this->hasMany(GeographicPricingSignal::class,'territory_evaluation_id'); }
}
