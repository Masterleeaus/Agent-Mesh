<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

final class ServiceTerritory extends CompanyScopedModel
{
    protected $table = 'maps_service_territories';
    protected $fillable = ['company_id','branch_id','workspace_id','name','description','effect','match_mode','priority','status','branch_public_id','service_keys','center_latitude','center_longitude','radius_metres','geometry','locality_values','maximum_road_distance_metres','maximum_drive_time_seconds','pricing_hint','effective_from','effective_until','created_by_user_id','updated_by_user_id','metadata'];
    protected function casts(): array { return ['priority'=>'integer','service_keys'=>'array','center_latitude'=>'float','center_longitude'=>'float','radius_metres'=>'float','geometry'=>'array','locality_values'=>'array','maximum_road_distance_metres'=>'integer','maximum_drive_time_seconds'=>'integer','pricing_hint'=>'array','effective_from'=>'immutable_datetime','effective_until'=>'immutable_datetime','metadata'=>'array']; }
    public function evaluations(): HasMany { return $this->hasMany(TerritoryEvaluation::class,'primary_territory_id'); }
}
